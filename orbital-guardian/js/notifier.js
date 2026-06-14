/* ============================================================
   ORBITAL GUARDIAN AI — AUTOMATED AUTHORITY ALERT ENGINE
   ------------------------------------------------------------
   TRIGGER: fires AUTOMATICALLY after every orbit scan for each
   conjunction whose band is CRITICAL or HIGH (the danger point).
   No human action required.

   DELIVERY CHANNELS (in priority order):
     1. BACKEND SMTP  — POST /api/alert/dispatch on the FastAPI
        backend → real email via SMTP + optional Telegram +
        webhook fan-out. (The real automated path.)
     2. EmailJS       — direct browser→email if the operator has
        configured EmailJS keys in OG_CONFIG.ALERTS (no backend).
     3. MAILTO DRAFT  — always available: opens the operator's
        mail client pre-filled with the full alert payload.

   DEDUPE: each event (pair+TCA) alerts only once per session.
   PAYLOAD: full situation snapshot — TCA, miss, Pc, ML risk,
   velocities, debris origin, recommended action, CDM text.
   ============================================================ */
(function () {
  "use strict";
  const C = window.OG_CONFIG;
  const N = {};
  window.OGNotifier = N;

  const sent = new Set();          // dedupe: "norad1-norad2-tcaMinute"
  N.log = [];                      // alert history for the UI

  /* ── payload builders ────────────────────────────────────── */
  function eventKey(ev) {
    return ev.primary.norad + "-" + ev.secondary.norad + "-" +
      ev.tca.toISOString().slice(0, 16);
  }

  N.buildPayload = function (ev, plan) {
    const sess = window.OG_SESSION || { email: "", callsign: "OPERATOR", agency: "ISRO" };
    const geo = (C.GEO_WEIGHTS[ev.origin] || C.GEO_WEIGHTS.XX);
    return {
      to: sess.email,
      operator: sess.callsign,
      agency: ev.primary.country === "JP" ? "JAXA SSA CENTER (TSUKUBA)" : "ISRO ISTRAC (BENGALURU)",
      severity: ev.band,
      subject: "🛰 [" + ev.band + "] CONJUNCTION ALERT — " + ev.primary.name +
        " vs DEBRIS #" + ev.secondary.norad + " | TCA " + ev.tca.toISOString().slice(11, 16) + "Z",
      body: [
        "AUTOMATED CONJUNCTION ALERT — ORBITAL GUARDIAN AI",
        "CLASSIFICATION : " + ev.band + " (ML RISK " + ev.score + "%)",
        "ISSUED (UTC)   : " + new Date().toISOString(),
        "",
        "PRIMARY ASSET  : " + ev.primary.name + " [" + (ev.primary.agency || "ISRO") +
          " · NORAD " + ev.primary.norad + " · " + ev.primary.regime + "]",
        "THREAT OBJECT  : " + ev.secondary.name + " [NORAD " + ev.secondary.norad + "]",
        "DEBRIS SOURCE  : " + (ev.secondary.event || "UNKNOWN") + " (" + geo.label + ")",
        "",
        "TCA            : " + ev.tca.toISOString().replace("T", " ").slice(0, 19) + " UTC",
        "MISS DISTANCE  : " + ev.missKm.toFixed(3) + " km (" + (ev.missKm * 1000).toFixed(0) + " m)",
        "REL VELOCITY   : " + ev.vRelKms.toFixed(3) + " km/s",
        "Pc (FOSTER-92) : " + ev.pc.toExponential(4),
        "",
        plan ? [
          "RECOMMENDED ACTION : ALONG-TRACK RETROGRADE BURN",
          "  DELTA-V          : " + plan.dvMs.toFixed(3) + " m/s",
          "  FUEL REQUIRED    : " + plan.fuelKg.toFixed(3) + " kg",
          "  POST-BURN MISS   : " + plan.newMissKm.toFixed(2) + " km",
          "  BURN LEAD TIME   : " + (plan.leadTimeS / 60).toFixed(0) + " min before TCA"
        ].join("\n") : "RECOMMENDED ACTION : ESCALATE TO FLIGHT DYNAMICS — REVIEW IMMEDIATELY",
        "",
        "— Dispatched automatically by Orbital Guardian AI on danger-point trigger.",
        "  Operator on console: " + sess.callsign + " <" + sess.email + ">"
      ].join("\n"),
      cdm: OGPhysics.generateCDM(ev, plan),
      cdmFilename: OGPhysics.cdmFilename(ev)
    };
  };

  /* ── channel 1: backend SMTP/Telegram/webhook fan-out ────── */
  async function viaBackend(payload) {
    const base = (C.ALERTS && C.ALERTS.BACKEND_URL) || "http://localhost:8000";
    try {
      const r = await fetch(base + "/api/alert/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();        // {channels:{email:true,...}}
    } catch (e) { return null; }
  }

  /* ── channel 2: EmailJS (browser → email, no backend) ────── */
  async function viaEmailJS(payload) {
    const E = C.ALERTS && C.ALERTS.EMAILJS;
    if (!E || !E.SERVICE_ID || E.SERVICE_ID.startsWith("YOUR_")) return null;
    try {
      const r = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: E.SERVICE_ID, template_id: E.TEMPLATE_ID, user_id: E.PUBLIC_KEY,
          template_params: { to_email: payload.to, subject: payload.subject, message: payload.body }
        })
      });
      return r.ok ? { channels: { emailjs: true } } : null;
    } catch (e) { return null; }
  }

  /* ── channel 3: mailto draft (always works) ──────────────── */
  N.mailtoDraft = function (payload) {
    const url = "mailto:" + encodeURIComponent(payload.to) +
      "?subject=" + encodeURIComponent(payload.subject) +
      "&body=" + encodeURIComponent(payload.body.slice(0, 1800));
    window.open(url, "_blank");
  };

  /* ── toast UI ────────────────────────────────────────────── */
  function toast(payload, channels) {
    const t = document.getElementById("alert-toast");
    if (!t) return;
    const chTxt = channels && Object.keys(channels).filter(k => channels[k]).join(" + ");
    t.innerHTML =
      '<div class="og-panel pulse-critical" style="padding:0">' +
      '<div class="og-panel-title"><span class="lamp red"></span> AUTHORITY ALERT DISPATCHED' +
      '<span class="tag">' + payload.severity + '</span></div>' +
      '<div class="og-panel-body" style="font-size:10px;line-height:1.8">' +
      '<b style="color:#ff9933">' + payload.subject.replace("🛰 ", "") + "</b><br>" +
      "→ " + payload.agency + "<br>" +
      "→ " + (payload.to || "console operator") + "<br>" +
      '<span class="muted">CHANNEL: ' + (chTxt || "MAIL CLIENT DRAFT") + "</span>" +
      '<div style="display:flex;gap:8px;margin-top:8px">' +
      '<button class="og-btn mini saffron" id="toast-mailto">✉ OPEN EMAIL DRAFT</button>' +
      '<button class="og-btn mini" id="toast-close">✕ DISMISS</button></div></div></div>';
    t.classList.add("show");
    document.getElementById("toast-mailto").onclick = () => N.mailtoDraft(payload);
    document.getElementById("toast-close").onclick = () => t.classList.remove("show");
    setTimeout(() => t.classList.remove("show"), 16000);
  }

  /* ── THE AUTOMATED TRIGGER ───────────────────────────────────
     Called by app.js after every scan. Dispatches for every
     CRITICAL/HIGH event not yet alerted this session.          */
  N.autoDispatch = async function (events, logFn) {
    const danger = events.filter(e =>
      (e.band === "CRITICAL" || e.band === "HIGH") && !sent.has(eventKey(e)));
    for (const ev of danger) {
      sent.add(eventKey(ev));
      const plan = OGPhysics.planManeuver(ev, new Date());
      const payload = N.buildPayload(ev, plan.feasible ? plan : null);

      logFn("⚡ DANGER POINT TRIGGERED — auto-dispatching authority alert for " +
        ev.primary.name + " [" + ev.band + "]", "err");

      let result = await viaBackend(payload);
      if (result) {
        logFn("✓ ALERT DELIVERED VIA BACKEND → " +
          Object.keys(result.channels).filter(k => result.channels[k]).join(", ").toUpperCase(), "ok");
      } else {
        result = await viaEmailJS(payload);
        if (result) logFn("✓ ALERT EMAILED VIA EMAILJS → " + payload.to, "ok");
        else logFn("BACKEND/EMAILJS UNREACHABLE — alert staged as mail-client draft (button on toast)", "warn");
      }
      N.log.push({ at: new Date(), payload, channels: result && result.channels });
      toast(payload, result && result.channels);
    }
    return danger.length;
  };
})();
