/* ============================================================
   ORBITAL GUARDIAN AI — SOVEREIGN ACCESS GATE v2
   MANDATORY authentication. No observer bypass.
   · Non-repeating canvas CAPTCHA (human verification)
   · Email OTP verification on signup (greeting mail template
     with Thought-of-the-Day, English only)
   · Delivery: backend SMTP (/api/otp/send) → real email;
     otherwise an honest SIMULATED-DELIVERY mail preview
   · Session + profile persisted for the profile/settings menu
   ============================================================ */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const LS_USERS = "og_users", LS_SESSION = "og_session", LS_CAPS = "og_used_captchas";
  const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

  let mode = "login";
  let pendingOTP = null, pendingUser = null, otpExpires = 0;

  /* ── storage helpers ─────────────────────────────────────── */
  function users() { try { return JSON.parse(localStorage.getItem(LS_USERS)) || {}; } catch (e) { return {}; } }
  function saveUsers(u) { localStorage.setItem(LS_USERS, JSON.stringify(u)); }
  function hash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); }
  function msg(text, cls) { const m = $("auth-msg"); m.textContent = text; m.className = cls || ""; }
  window.OG_SESSION = null;

  /* ════════ NON-REPEATING CAPTCHA ════════
     5-char code drawn distorted on canvas. Every issued code is
     recorded; a code can never be served twice on this device. */
  let captchaCode = "";
  const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity

  function usedCaps() { try { return JSON.parse(localStorage.getItem(LS_CAPS)) || []; } catch (e) { return []; } }

  function newCaptcha() {
    const used = new Set(usedCaps());
    do {
      captchaCode = Array.from({ length: 5 },
        () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join("");
    } while (used.has(captchaCode));
    used.add(captchaCode);
    localStorage.setItem(LS_CAPS, JSON.stringify([...used].slice(-4000)));
    drawCaptcha();
    $("captcha-in").value = "";
  }

  function drawCaptcha() {
    const cv = $("captcha-cv"); if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx || !ctx.fillRect) return;       // headless guard
    const w = cv.width = 190, h = cv.height = 54;
    ctx.fillStyle = "#040818"; ctx.fillRect(0, 0, w, h);
    // noise mesh
    for (let i = 0; i < 7; i++) {
      ctx.strokeStyle = `rgba(0,212,255,${0.08 + Math.random() * 0.12})`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * w, Math.random() * h);
      ctx.bezierCurveTo(Math.random() * w, Math.random() * h,
        Math.random() * w, Math.random() * h, Math.random() * w, Math.random() * h);
      ctx.stroke();
    }
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(255,153,51,${Math.random() * 0.35})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
    }
    // glyphs — each rotated/jittered
    for (let i = 0; i < captchaCode.length; i++) {
      ctx.save();
      ctx.translate(24 + i * 32, h / 2 + (Math.random() * 10 - 5));
      ctx.rotate((Math.random() * 36 - 18) * Math.PI / 180);
      ctx.font = `${22 + Math.floor(Math.random() * 8)}px monospace`;
      ctx.fillStyle = ["#ff9933", "#00d4ff", "#f5f5f5", "#9b59ff"][i % 4];
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 6;
      ctx.fillText(captchaCode[i], -8, 8);
      ctx.restore();
    }
  }

  function captchaOK() {
    return $("captcha-in").value.trim().toUpperCase() === captchaCode;
  }

  function normalizeCaptchaInput(e) {
    const input = e.target;
    const upper = input.value.toUpperCase();
    if (input.value === upper) return;
    const start = input.selectionStart, end = input.selectionEnd;
    input.value = upper;
    input.setSelectionRange(start, end);
  }

  /* ════════ OTP — GREETING EMAIL (ENGLISH ONLY) ════════ */
  const THOUGHTS = [
    "“We are all in the gutter, but some of us are looking at the stars.” — Oscar Wilde",
    "“The Earth is the cradle of humanity, but mankind cannot stay in the cradle forever.” — Konstantin Tsiolkovsky",
    "“Dream is not that which you see while sleeping; it is something that does not let you sleep.” — A. P. J. Abdul Kalam",
    "“Across the sea of space, the stars are other suns.” — Carl Sagan",
    "“Failure will never overtake me if my definition to succeed is strong enough.” — A. P. J. Abdul Kalam",
    "“That's one small step for man, one giant leap for mankind.” — Neil Armstrong",
    "“Curiosity is the essence of our existence.” — Gene Cernan",
    "“To confine our attention to terrestrial matters would be to limit the human spirit.” — Stephen Hawking"
  ];

  function buildOTPMail(email, callsign, otp) {
    const thought = THOUGHTS[Math.floor(Math.random() * THOUGHTS.length)];
    return {
      to: email,
      subject: "🛰 Welcome aboard, " + callsign + " — Your Orbital Guardian verification code: " + otp,
      body: [
        "═══════════════════════════════════════════════",
        "   ORBITAL GUARDIAN AI — SOVEREIGN ACCESS DESK",
        "═══════════════════════════════════════════════",
        "",
        "Namaste " + callsign + ",",
        "",
        "Welcome to the Sovereign Orbital Defense Grid. Your operator",
        "registration is one step from completion. Use this one-time",
        "verification code at the console within 10 minutes:",
        "",
        "        ┌─────────────────────┐",
        "        │   OTP :  " + otp + "     │",
        "        └─────────────────────┘",
        "",
        "Once verified, this address becomes your AUTOMATED ALERT",
        "DESTINATION — every CRITICAL/HIGH conjunction involving the",
        "fleet will reach you here with full telemetry and a CCSDS CDM.",
        "",
        "───────────────────────────────────────────────",
        "🌠 THOUGHT OF THE DAY",
        thought,
        "───────────────────────────────────────────────",
        "",
        "Stay fresh, stay sharp — the sky never sleeps, and from today",
        "neither does your watch over it. We are honoured to have a new",
        "pair of eyes guarding 70 spacecraft and 27,000 pieces of sky.",
        "",
        "Per aspera ad astra,",
        "— The Orbital Guardian AI Flight Desk",
        "  (This is an automated English-language dispatch. Never share your OTP.)"
      ].join("\n")
    };
  }

  async function deliverOTP(mail) {
    const base = (window.OG_CONFIG.ALERTS && window.OG_CONFIG.ALERTS.BACKEND_URL) || "http://localhost:8000";
    try {
      const r = await fetch(base + "/api/otp/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mail)
      });
      if (r.ok) { const j = await r.json(); if (j.delivered) return "EMAIL"; }
    } catch (e) { /* backend down */ }
    // honest fallback: simulated-delivery preview
    $("otp-preview").textContent = mail.body;
    $("otp-preview-wrap").style.display = "block";
    return "SIMULATED";
  }

  /* ════════ UI FLOW ════════ */
  function setMode(m) {
    mode = m;
    $("tab-login").classList.toggle("active", m === "login");
    $("tab-signup").classList.toggle("active", m === "signup");
    $("signup-extra").style.display = m === "signup" ? "block" : "none";
    $("otp-step").style.display = "none";
    $("auth-form-step").style.display = "block";
    $("auth-submit").textContent = m === "login" ? "⬢ AUTHENTICATE" : "⬢ REGISTER & SEND OTP";
    msg("");
    newCaptcha();
  }

  function grant(session) {
    session.loginTime = Date.now();
    session.expiresAt = session.loginTime + SESSION_TTL_MS;
    window.OG_SESSION = session;
    localStorage.setItem(LS_SESSION, JSON.stringify(session));
    $("access-granted").classList.add("show");
    $("ag-name").textContent = "OPERATOR: " + session.callsign.toUpperCase() + " · " + session.agency;
    setTimeout(() => {
      $("auth-gate").classList.add("exit");
      document.dispatchEvent(new Event("og-authenticated"));
      setTimeout(() => { const g = $("auth-gate"); if (g) g.remove(); }, 1300);
    }, 1400);
  }

  async function submit() {
    const email = $("auth-email").value.trim().toLowerCase();
    const pass = $("auth-pass").value;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return msg("ENTER A VALID OPERATOR EMAIL", "err");
    if (pass.length < 4) return msg("PASSCODE TOO SHORT (MIN 4)", "err");
    if (!captchaOK()) { newCaptcha(); return msg("CAPTCHA MISMATCH — HUMAN VERIFICATION FAILED, NEW CODE ISSUED", "err"); }
    const u = users();

    if (mode === "login") {
      if (!u[email]) return msg("UNKNOWN OPERATOR — SIGN UP FIRST", "err");
      if (u[email].h !== hash(pass)) { newCaptcha(); return msg("ACCESS DENIED — WRONG PASSCODE", "err"); }
      msg("CREDENTIALS + CAPTCHA VERIFIED", "ok");
      grant({ email, callsign: u[email].callsign, agency: u[email].agency, verified: !!u[email].verified });
      return;
    }

    // SIGNUP → OTP verification stage
    if (u[email]) return msg("OPERATOR ALREADY REGISTERED — LOG IN", "err");
    const callsign = ($("auth-callsign").value.trim() || email.split("@")[0]).toUpperCase();
    const agency = $("auth-agency").value;
    pendingOTP = String(Math.floor(100000 + Math.random() * 900000));
    otpExpires = Date.now() + 10 * 60 * 1000;
    pendingUser = { email, h: hash(pass), callsign, agency };

    msg("DISPATCHING VERIFICATION OTP…", "ok");
    const channel = await deliverOTP(buildOTPMail(email, callsign, pendingOTP));
    $("auth-form-step").style.display = "none";
    $("otp-step").style.display = "block";
    $("otp-channel").textContent = channel === "EMAIL"
      ? "✓ OTP EMAILED TO " + email.toUpperCase()
      : "BACKEND MAIL RELAY OFFLINE — OTP shown in the SIMULATED DELIVERY preview below (in production this arrives in your inbox)";
    $("otp-in").focus();
  }

  function verifyOTP() {
    if (!pendingOTP) return;
    if (Date.now() > otpExpires) { msg("OTP EXPIRED — REGISTER AGAIN", "err"); setMode("signup"); return; }
    if ($("otp-in").value.trim() !== pendingOTP) {
      $("otp-msg").textContent = "✗ WRONG CODE — CHECK THE MAIL AND RETRY";
      $("otp-msg").className = "err"; return;
    }
    const u = users();
    u[pendingUser.email] = { ...pendingUser, verified: true, created: Date.now() };
    delete u[pendingUser.email].email;
    saveUsers(u);
    $("otp-msg").textContent = "✓ EMAIL VERIFIED — OPERATOR COMMISSIONED";
    $("otp-msg").className = "ok";
    setTimeout(() => grant({ email: pendingUser.email, callsign: pendingUser.callsign, agency: pendingUser.agency, verified: true }), 700);
  }
  function restoreSession() {
    try {
      const session = JSON.parse(localStorage.getItem(LS_SESSION));

      // Session does not exist or is malformed
      if (!session || typeof session !== "object" || !session.email) {
        localStorage.removeItem(LS_SESSION);
        return false;
      }

      // Session is expired: expiresAt must exist and must not be in the past
      if (!session.expiresAt || typeof session.expiresAt !== "number" || Date.now() > session.expiresAt) {
        localStorage.removeItem(LS_SESSION);
        return false;
      }

      // User must still exist in the registry
      const allUsers = users();
      if (!allUsers[session.email]) {
        localStorage.removeItem(LS_SESSION);
        return false;
      }

      // All checks passed: session is valid
      window.OG_SESSION = session;
      return true;

    } catch (err) {
      console.error("Session restore failed:", err);
      localStorage.removeItem(LS_SESSION);
      return false;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Session is already restored and valid: gate should be removed immediately
    if (window.OG_SESSION) {
      const gate = $("auth-gate");
      if (gate) {
        gate.remove();
      }
      // Dispatch authentication event after gate is safely removed
      document.dispatchEvent(new Event("og-authenticated"));
      return;
    }

    // Session is not valid; ensure auth gate exists before setting up form
    const authGate = $("auth-gate");
    if (!authGate) {
      console.warn("Auth gate element not found in DOM; form handlers will not be attached.");
      return;
    }

    // Set up all form event listeners and CAPTCHA
    const captchaInput = $("captcha-in");
    if (captchaInput) {
      captchaInput.addEventListener("input", normalizeCaptchaInput);
    }

    $("astro-img").src = window.ASTRONAUT_URI;
    $("tab-login").onclick = () => setMode("login");
    $("tab-signup").onclick = () => setMode("signup");
    $("auth-submit").onclick = submit;

    $("auth-pass").addEventListener("keydown", e => {
      if (e.key === "Enter") submit();
    });

    $("captcha-refresh").onclick = newCaptcha;
    $("otp-verify").onclick = verifyOTP;

    $("otp-in").addEventListener("keydown", e => {
      if (e.key === "Enter") verifyOTP();
    });

    $("otp-back").onclick = () => setMode("signup");

    // Initialize first CAPTCHA and UI state
    newCaptcha();
  });

  document.addEventListener("og-logout", () => {
    localStorage.removeItem(LS_SESSION);
    location.reload();
  });

  /* ════════ EARLY SESSION RESTORATION ════════
     Restore session as soon as script loads, before DOMContentLoaded.
     This ensures window.OG_SESSION is ready before dependent modules initialize.
     Gate removal happens in DOMContentLoaded to ensure DOM is fully ready. */
  restoreSession();
})();
