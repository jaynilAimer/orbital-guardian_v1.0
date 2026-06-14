/* ============================================================  
   ORBITAL GUARDIAN AI — UI EXTRAS  
   Reading vault · FAQ · User guide · Profile menu ·  
   Demo attack drill · Mega-footer live telemetry  
   ============================================================ */  
(function () {  
  "use strict";  
  const $ = id => document.getElementById(id);  
  
  /* ════════ DEEP-SPACE READING VAULT ════════ */  
  let libIdx = 0;  
  function renderLibTabs() {  
    const tabs = $("lib-tabs");  
    tabs.innerHTML = "";  
    window.OG_LIBRARY.forEach((d, i) => {  
      const b = document.createElement("div");  
      b.className = "lib-tab" + (i === libIdx ? " active" : "");  
      b.textContent = d.icon + " " + d.domain;  
      b.onclick = () => { libIdx = i; renderLibTabs(); renderShelf(); };  
      tabs.appendChild(b);  
    });  
  }  
  function renderShelf() {  
    const d = window.OG_LIBRARY[libIdx];  
    $("lib-blurb").textContent = d.blurb + "  — 30 titles below.";  
    const shelf = $("lib-shelf");  
    shelf.innerHTML = "";  
    d.books.forEach((b, i) => {  
      const card = document.createElement("div");  
      card.className = "book-card";  
      const hue = [d.color, "#1b2a6b", "#2d1b4e", "#3a2a10", "#10303a"][i % 5];  
      card.innerHTML =  
        `<div class="book-spine" style="background:linear-gradient(105deg, ${hue}, #090d22 80%)"></div>  
         <div style="min-width:0">  
           <div class="bk-t">${b.t}</div>  
           <div class="bk-a">${b.a} · ${b.y}</div>  
           <div class="bk-n">${b.note}</div>  
           <span class="bk-open" data-q="${encodeURIComponent(b.t + " " + b.a + " book")}">📖 OPEN / FIND THIS BOOK ↗</span>  
         </div>`;  
      card.querySelector(".bk-open").onclick = e => {  
        const q = e.target.dataset.q;  
        window.open("https://www.google.com/search?q=" + q + "+read+online+OR+archive.org+OR+pdf", "_blank");  
        if (window.OG_LOG) OG_LOG("READING VAULT → opened search for: " + decodeURIComponent(q).slice(0, 50), "info");  
      };  
      shelf.appendChild(card);  
    });  
  }  
  
  /* ════════ FAQ ════════ */  
  const FAQS = [  
    ["Is the satellite and debris data real?",  
     "Yes. Every orbit comes from <b>real NORAD Two-Line Element sets</b> served by CelesTrak's GP API — the same catalog the world's space agencies screen against. The debris objects are genuine tracked fragments of the 2007 Fengyun-1C ASAT test and the 2009 Cosmos-2251/Iridium-33 collision. Each TLE line is <i>checksum-verified</i> on load; any corrupted or tampered line is rejected automatically."],  
    ["How accurate are the predicted close approaches?",  
     "TLE + SGP4 accuracy is typically <b>1–3 km</b>, growing with prediction age. Our screening pipeline (50 km gate → 90 s coarse sweep → 1 s refinement) finds genuine close approaches, but the collision probabilities use <i>assumed covariances</i> — real operations use radar-fitted uncertainty per object. Treat results as screening-grade intelligence, not maneuver authority."],  
    ["What is the Foster model this terminal keeps mentioning?",  
     "Foster &amp; Estes (1992, NASA JSC-25898) is the standard 2-D collision-probability method: at closest approach, the combined position uncertainty is projected onto the encounter plane and integrated over the combined hard-body circle. We use the closed form valid when the hard body (20 m) is much smaller than the uncertainty ellipse (400–1500 m) — the same family of math used in operational CDMs."],  
    ["What exactly happens when a CRITICAL event is found?",  
     "The danger point triggers <b>automatically</b>: the engine builds a full situation packet (TCA, miss distance, relative velocity, Pc, ML risk, recommended ΔV burn, CCSDS CDM) and dispatches it to your registered email via the backend's SMTP relay, plus Telegram and webhook if configured. Each event alerts only once per session — no spam, no human in the loop."],  
    ["Why do I have to log in and verify with OTP?",  
     "Because the alert engine is personal: <i>your</i> email is the destination authority. Mandatory CAPTCHA proves you're human, the OTP proves the mailbox is yours. Without a verified operator, the model stays sealed. (The gate is demo-grade by design — production deployment should front it with organizational SSO.)"],  
    ["What is the Kessler Syndrome and should I worry?",  
     "Donald Kessler showed in 1978 that above a critical density, collisions create fragments faster than drag removes them — a slow chain reaction that could close orbital shells for generations. The 800–1000 km band (where Fengyun-1C debris lives) is the most stressed region today. Our cascade heatmap runs that exact math forward 25 years. Worry is the wrong word — <i>engineering discipline</i> is the right one."],  
    ["Why does the globe sometimes show a flat map instead?",  
     "The 3-D globe needs the Cesium engine from a CDN plus imagery streams. If your network blocks them, the terminal degrades gracefully to a live 2-D tactical map running the same SGP4 physics. Nothing else loses function — scans, alerts, CDMs and analytics are all local."],  
    ["Can ISRO or JAXA actually use this?",  
     "As a visualization, training and rapid-screening layer — genuinely useful. As an operational CA system — no: that requires owner/operator ephemerides, radar-fitted covariances, and legal CDM exchange channels (Space-Track, EU SST). The honest gap between this terminal and ISTRAC's IS4OM is documented openly in the provenance section."],  
    ["What does the ΔV number in a maneuver plan mean?",  
     "It's the velocity change needed so the satellite arrives at the conjunction point displaced enough to be safe. Via the Clohessy–Wiltshire equations, an along-track burn Δv applied τ seconds early drifts the craft ≈3·Δv·τ along-track. Burning <i>earlier</i> is exponentially cheaper — with 6 hours of warning, dodging by 10 km costs about the velocity of a walking ant: a few cm/s."],  
    ["Where does the 'Thought of the Day' in my OTP mail come from?",  
     "A curated set of space-history quotations — Tsiolkovsky, Kalam, Sagan, Armstrong, Hawking. One is chosen randomly per mail, in English, so every new operator's welcome is slightly different. Small touch; better mornings."]  
  ];  
  
  function renderFAQ() {  
    const box = $("faq-body");  
    box.innerHTML = "";  
    FAQS.forEach(([q, a]) => {  
      const item = document.createElement("div");  
      item.className = "faq-item";  
      item.innerHTML = `<div class="faq-q"><span>◈ ${q}</span><span class="chev">▶</span></div>  
        <div class="faq-a"><div class="faq-a-inner">${a}</div></div>`;  
      item.querySelector(".faq-q").onclick = () => item.classList.toggle("open");  
      box.appendChild(item);  
    });  
  }  
  
  /* ════════ USER GUIDE (after boot) ════════ */  
  const GUIDE = [  
    ["WELCOME TO THE WATCH", "You are now a commissioned operator of the <b style='color:#ff9933'>Sovereign Orbital Defense Grid</b>. This 60-second field guide walks the console once. You can replay it anytime from your profile menu (top-right)."],  
    ["THE GLOBE", "The center stage tracks <b>70 real ISRO/JAXA spacecraft</b> with live SGP4 orbits — saffron paths are India, indigo are Japan, red dots are debris. Click any satellite to lock the camera and deploy its 3-D bus model. Use <b>⏩</b> to accelerate time and <b>🌗/☀</b> to toggle the day/night terminator."],  
    ["THE ASSET REGISTRY", "The right panel lists every tracked spacecraft with live risk badges. Click a card → camera lock + full official dossier (launch, vehicle, mass, mission role — sourced from ISRO/JAXA pages, never invented)."],  
    ["THREAT INTELLIGENCE", "The scan engine sweeps 12 hours ahead every 5 minutes. Each row is a real predicted close approach: TCA, miss distance, Foster probability, ML risk. <b style='color:#ff5555'>CRITICAL rows pulse red</b> — click one for the typewriter intel report."],  
    ["AUTONOMOUS RESPONSE", "For any locked event: <b>SIMULATE MANEUVER</b> computes the ΔV and fuel to dodge; <b>GENERATE CDM</b> produces the CCSDS message; <b>☄ ATTACK DRILL</b> war-games a worst-case impactor and fires the full automated alert chain so you can watch the system defend."],  
    ["AUTOMATED ALERTS", "You never need to press anything: the moment a CRITICAL/HIGH conjunction is detected, a full alert packet (telemetry + CDM) is dispatched to <b>your registered email</b> — plus Telegram/webhook if the backend has credentials."],  
    ["GO DEEPER", "Below the console: the <b>Analytics Core</b> (Kessler cascade heatmap), the <b>Reading Vault</b> (150 real books across 5 space domains), a full <b>FAQ</b>, and complete data-provenance documentation. The sky never sleeps. Neither does this terminal. <span style='color:#1fb84f'>— Good hunting, operator.</span>"]  
  ];  
  let gStep = 0;  
  function renderGuide() {  
    const [t, b] = GUIDE[gStep];  
    $("guide-title").textContent = "OPERATOR FIELD GUIDE — " + t;  
    $("guide-step-tag").textContent = (gStep + 1) + " / " + GUIDE.length;  
    $("guide-body").innerHTML = b;  
    $("guide-dots").innerHTML = GUIDE.map((_, i) =>  
      `<span class="${i === gStep ? "on" : ""}"></span>`).join("");  
    $("guide-prev").style.visibility = gStep === 0 ? "hidden" : "visible";  
    $("guide-next").textContent = gStep === GUIDE.length - 1 ? "FINISH ✓" : "NEXT →";  
  }  
  function openGuide() { gStep = 0; renderGuide(); $("guide-veil").classList.add("open"); }  
  function closeGuide() {  
    $("guide-veil").classList.remove("open");  
    localStorage.setItem("og_guide_seen", "1");  
  }  
  
  /* ════════ PROFILE MENU ════════ */  
  function refreshProfile() {  
    const s = window.OG_SESSION;  
    if (!s) return;  
    $("profile-name").textContent = s.callsign.toUpperCase().slice(0, 12);  
    $("pm-callsign").textContent = "⬢ " + s.callsign.toUpperCase();  
    $("pm-email").textContent = s.email;  
    $("pm-agency").textContent = s.agency + " DESK";  
    $("pm-verified").innerHTML = s.verified  
      ? '<span style="color:#1fb84f">✓ EMAIL VERIFIED (OTP)</span>'  
      : '<span style="color:#ffd24d">○ LEGACY SESSION — RE-REGISTER TO VERIFY</span>';  
  }  
  
  /* ════════ DEMO ATTACK DRILL ════════ */  
  const DRILL_SCENARIOS = [  
    { name: "SIM-KKV-STRIKE", kind: "HOSTILE KINETIC-KILL FRAGMENT", origin: "CN" },  
    { name: "SIM-METEOROID-2026F", kind: "CELESTIAL BODY — SPORADIC METEOROID STREAM", origin: "XX" },  
    { name: "SIM-ROGUE-STAGE", kind: "UNCONTROLLED ROCKET BODY RE-ENTRY CORRIDOR", origin: "RU" }  
  ];  
  let drillNo = 0;  
  
  async function runDrill() {  
    const log = window.OG_LOG, S = window.OG_STATE;  
    const sc = DRILL_SCENARIOS[drillNo++ % DRILL_SCENARIOS.length];  
    log("☄ ═══ ATTACK DRILL INITIATED — " + sc.kind + " ═══", "err");  
    log("WAR-GAME: injecting " + sc.name + " on a crossing trajectory…", "warn");  
  
    const target = S.assets.find(a => a.name === "CARTOSAT-3" && a.satrec) ||  
                   S.assets.find(a => a.regime === "LEO" && a.country === "IN" && a.satrec);  
    const threat = OGPhysics.injectTrainingThreat(target, 4);  
    if (!threat) { log("DRILL ABORT — injector failed", "err"); return; }  
    threat.name = sc.name; threat.origin = sc.origin;  
    threat.event = "⚠ DRILL — " + sc.kind + " (simulated, tuned vs " + target.name + ")";  
    S.debris.push(threat);  
    log("THREAT LIVE IN CATALOG — rescanning the sky…", "warn");  
    document.getElementById("btn-scan").click();  
    setTimeout(() => {  
      log("DRILL CHAIN COMPLETE — verify the authority alert toast/email. " +  
          "This was an exercise: object " + sc.name + " is synthetic and flagged as such everywhere.", "ok");  
    }, 6000);  
  }  
  
  /* ════════ MEGA FOOTER TELEMETRY ════════ */  
  function tickFooter() {  
    const S = window.OG_STATE;  
    if (!S) return;  
    $("mft-assets").textContent = S.assets.length + " assets";  
    $("mft-debris").textContent = S.debris.length + " debris tracked";  
    $("mft-events").textContent = S.events.length + " conjunctions in window";  
    $("mft-utc").textContent = new Date().toISOString().slice(11, 19) + "Z";  
    const iss = S.assets.find(a => a.norad === 25544);  
    if (iss && iss.satrec && window.satellite) {  
      const pv = OGPhysics.eciAt(iss, new Date());  
      if (pv) {  
        const gd = satellite.eciToGeodetic(pv.position, satellite.gstime(new Date()));  
        $("mft-iss").textContent = "ISS: " +  
          satellite.degreesLat(gd.latitude).toFixed(1) + "°, " +  
          satellite.degreesLong(gd.longitude).toFixed(1) + "° @ " +  
          gd.height.toFixed(0) + " km";  
      }  
    }  
  }  
  
  /* ════════ WIRE-UP ════════ */  
  document.addEventListener("DOMContentLoaded", () => {  
    renderLibTabs(); renderShelf(); renderFAQ();  
  
    // profile menu  
    $("profile-chip").onclick = e => { e.stopPropagation(); $("profile-menu").classList.toggle("open"); };  
    document.addEventListener("click", () => $("profile-menu").classList.remove("open"));  
    $("profile-menu").onclick = e => e.stopPropagation();  
    $("pm-logout").onclick = () => document.dispatchEvent(new Event("og-logout"));  
    $("pm-guide").onclick = () => { $("profile-menu").classList.remove("open"); openGuide(); };  
    $("pm-settings").onclick = () => {  
      $("profile-menu").classList.remove("open");  
      document.querySelector('#sidebar .nav-item[data-view="docs"]').click();  
      if (window.OG_LOG) OG_LOG("SETTINGS → configuration is in js/config.js + backend env vars (see documentation)", "info");  
    };  
    $("pm-alerts").onclick = () => {  
      const n = window.OGNotifier ? OGNotifier.log.length : 0;  
      $("pm-alert-count").textContent = n;  
      if (window.OG_LOG) OG_LOG("ALERT HISTORY: " + n + " automated dispatch(es) this session", "info");  
    };  
  
    // guide controls  
    $("guide-next").onclick = () => { if (gStep >= GUIDE.length - 1) closeGuide(); else { gStep++; renderGuide(); } };  
    $("guide-prev").onclick = () => { if (gStep > 0) { gStep--; renderGuide(); } };  
    $("guide-skip").onclick = closeGuide;  
  
    // drill  
    $("btn-demo-attack").onclick = runDrill;  
  
    // footer nav scroll  
    document.querySelectorAll(".mf-nav a[data-goto]").forEach(a => {  
      a.onclick = () => { const el = $(a.dataset.goto); if (el) el.scrollIntoView({ behavior: "smooth" }); };  
    });  
  
    setInterval(tickFooter, 2000);  
  });  
  
  // post-boot hooks: profile fill + first-run guide  
  document.addEventListener("og-authenticated", () => {  
    refreshProfile();  
    setTimeout(() => {  
      if (!localStorage.getItem("og_guide_seen")) openGuide();  
    }, 7500);  
  });  
})();  
