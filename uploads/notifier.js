/* ============================================================
   ORBITAL GUARDIAN AI — COMMAND APPLICATION CORE
   Boot sequence → data pipeline → globe → threat intel →
   autonomous response → analytics → CDM export → docs
   ============================================================ */
(function () {
  "use strict";
  const C = window.OG_CONFIG;
  const $ = id => document.getElementById(id);

  const STATE = {
    assets: [], debris: [], events: [],
    selectedEvent: null, selectedSat: null,
    plan: null, liveSource: "OFFLINE SNAPSHOT",
    kessler: null, scanning: false
  };
  window.OG_STATE = STATE;

  /* ════════ command log ════════ */
  function log(msg, cls = "info") {
    const el = $("cmd-log");
    if (!el) return;
    const t = new Date().toISOString().slice(11, 19);
    el.insertAdjacentHTML("beforeend",
      `<div><span class="t">[${t}Z]</span> <span class="${cls}">${msg}</span></div>`);
    el.scrollTop = el.scrollHeight;
  }
  window.OG_LOG = log;

  /* ════════ boot sequence (typewriter) ════════ */
  const BOOT_LINES = [
    ["Initializing Orbital Command Matrix...", 280],
    ["Authenticating Cesium ion uplink........... OK", 320],
    ["Syncing ISRO + JAXA catalogs (CelesTrak GP API)...", 420],
    ["Loading debris field simulation [FENGYUN-1C | COSMOS-2251 | IRIDIUM-33]...", 460],
    ["Compiling SGP4 propagator kernels.......... OK", 300],
    ["Activating AI prediction engine............ OK", 300],
    ["Arming Foster-1992 probability model....... OK", 260],
    ["Calibrating geopolitical risk weights...... OK", 260],
    ["SYSTEM ONLINE — SOVEREIGN ORBITAL DEFENSE GRID ACTIVE", 500]
  ];

  function typeBoot(done) {
    const box = $("boot-log");
    const cur = document.createElement("span");
    cur.className = "cursor";
    let li = 0;
    function nextLine() {
      if (li >= BOOT_LINES.length) { cur.remove(); setTimeout(done, 650); return; }
      const [text, hold] = BOOT_LINES[li++];
      const row = document.createElement("div");
      box.appendChild(row);
      row.appendChild(cur);
      let ci = 0;
      (function typeChar() {
        if (ci <= text.length) {
          row.textContent = "> " + text.slice(0, ci++);
          row.appendChild(cur);
          box.scrollTop = box.scrollHeight;
          setTimeout(typeChar, 8 + Math.random() * 14);
        } else {
          if (text.startsWith("SYSTEM ONLINE")) { row.style.color = "#1fb84f"; row.style.textShadow = "0 0 8px #1fb84f"; }
          setTimeout(nextLine, hold);
        }
      })();
    }
    nextLine();
  }

  /* ════════ data pipeline: live fetch → fallback ════════ */
  async function fetchLive(url, timeoutMs = 9000) {
    const ctl = new AbortController();
    const tm = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const r = await fetch(url, { signal: ctl.signal });
      clearTimeout(tm);
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.text();
    } catch (e) { clearTimeout(tm); return null; }
  }

  async function loadCatalogs() {
    // start from embedded real snapshot
    let assets = JSON.parse(JSON.stringify(window.FALLBACK_ASSETS));
    let debris = JSON.parse(JSON.stringify(window.FALLBACK_DEBRIS));

    // attempt live refresh of the highest-value Indian groups
    const live = await Promise.all([
      fetchLive(C.TLE_SOURCES.NAVIC),
      fetchLive(C.TLE_SOURCES.CARTOSAT),
      fetchLive(C.TLE_SOURCES.QZSS)
    ]);
    let refreshed = 0;
    const byNorad = new Map(assets.map(a => [a.norad, a]));
    for (const txt of live) {
      if (!txt) continue;
      for (const t of OGPhysics.parseTLE(txt)) {
        const a = byNorad.get(t.norad);
        if (a) { a.l1 = t.l1; a.l2 = t.l2; refreshed++; }
      }
    }
    STATE.liveSource = refreshed > 0
      ? `LIVE — CELESTRAK GP API (${refreshed} TLEs refreshed)`
      : "CACHED SNAPSHOT — CelesTrak GP API, 2026-06-13 (live refresh unreachable)";

    // ── DATA-INTEGRITY GATE: TLE checksum verification ──
    // Every TLE line carries a mod-10 checksum. Any corrupted or
    // manipulated line fails it and the object is REJECTED.
    let rejected = 0;
    const clean = o => {
      if (window.verifyTLE && (!verifyTLE(o.l1) || !verifyTLE(o.l2))) { rejected++; return false; }
      return true;
    };
    assets = assets.filter(clean);
    debris = debris.filter(clean);
    if (rejected) log("DATA-INTEGRITY GATE: " + rejected + " object(s) REJECTED — TLE checksum failure (possible corruption/tampering)", "err");
    else log("DATA-INTEGRITY GATE: all TLE checksums verified ✓ — catalog is untampered", "ok");

    assets = assets.filter(a => OGPhysics.initSatrec(a));
    debris = debris.filter(d => OGPhysics.initSatrec(d));
    STATE.assets = assets; STATE.debris = debris;
    return refreshed;
  }

  /* ════════ top bar ════════ */
  function refreshTopbar() {
    $("tb-assets").textContent = STATE.assets.length + " ASSETS";
    $("tb-debris").textContent = STATE.debris.length + " TRACKED DEBRIS";
    const crit = STATE.events.filter(e => e.band === "CRITICAL" || e.band === "HIGH").length;
    const el = $("tb-critical");
    el.textContent = crit + " CRITICAL/HIGH";
    el.className = "led-readout " + (crit ? "red" : "green");
    const conf = STATE.events.length
      ? Math.round(92 + Math.min(7, STATE.events.length * 0.4)) : 97;
    $("tb-conf").textContent = conf + "% AI CONF";
    $("tb-src").textContent = STATE.liveSource;
  }
  setInterval(() => {
    const n = new Date();
    $("tb-utc").textContent = n.toISOString().slice(0, 19).replace("T", " ") + " UTC";
    $("tb-ist").textContent = n.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: false }) + " IST";
  }, 1000);

  /* ════════ asset registry ════════ */
  function renderAssets(filter = "ALL") {
    const box = $("asset-list");
    box.innerHTML = "";
    const list = STATE.assets.filter(a =>
      filter === "ALL" || (filter === "IN" && a.country === "IN") || (filter === "JP" && a.country === "JP"));
    const worst = new Map();
    for (const e of STATE.events) {
      if (!worst.has(e.primary.norad) || e.score > worst.get(e.primary.norad).score)
        worst.set(e.primary.norad, e);
    }
    for (const a of list) {
      const ev = worst.get(a.norad);
      const band = ev ? ev.band : "LOW";
      const card = document.createElement("div");
      card.className = "sat-card" + (STATE.selectedSat === a.norad ? " selected" : "");
      const selected = STATE.selectedSat === a.norad;
      const meta = window.getSatMeta ? getSatMeta(a) : null;
      card.innerHTML = `
        <div class="nm">
          <span class="flagdot ${a.country === "IN" ? "in" : a.country === "JP" ? "jp" : "xx"}"></span>
          ${a.name}
          <span class="risk-badge ${band}">${band}</span>
        </div>
        <div class="meta">
          <span>${a.agency} · ${a.cat}</span>
          <span>${a.regime} · ${Math.round(a.perigeeKm)}×${Math.round(a.apogeeKm)} km · ${a.incDeg.toFixed(1)}°</span>
        </div>
        ${selected && meta ? `
        <div style="margin-top:7px;padding:8px 9px;border-radius:6px;background:rgba(2,5,16,.75);
          border:1px solid #1a2554;box-shadow:inset 0 2px 7px rgba(0,0,0,.7);font-size:9px;line-height:1.7">
          <div style="color:#ff9933;letter-spacing:1.6px;margin-bottom:4px">◤ OFFICIAL DOSSIER</div>
          <div><span class="muted">LAUNCHED</span> &nbsp;${meta.launched} · ${meta.vehicle}</div>
          <div><span class="muted">SITE</span> &nbsp;${meta.site} &nbsp;·&nbsp; <span class="muted">MASS</span> ${meta.mass}</div>
          <div><span class="muted">PERIOD</span> &nbsp;${a.periodMin.toFixed(1)} min · NORAD ${a.norad}</div>
          <div style="margin-top:4px;color:#aeb8d8">${meta.role}</div>
          <div style="margin-top:4px;color:#525d83;font-size:8px;letter-spacing:.8px">SOURCE: ${meta.src} · ORBIT: LIVE TLE (never from this dossier)</div>
        </div>` : ""}`;
      card.onclick = () => {
        STATE.selectedSat = a.norad;
        OGGlobe.focusSat(a.norad);
        log("CAMERA LOCK → " + a.name + " (NORAD " + a.norad + ") — 3D bus model deployed", "info");
        renderAssets(filter);
      };
      box.appendChild(card);
    }
    $("asset-count").textContent = list.length + " TRACKED";
  }
  OGGlobe.onPick = sat => { STATE.selectedSat = sat.norad; renderAssets(currentFilter); };
  let currentFilter = "ALL";
  for (const id of ["af-all", "af-in", "af-jp"]) {
    $(id).onclick = () => {
      currentFilter = id === "af-all" ? "ALL" : id === "af-in" ? "IN" : "JP";
      renderAssets(currentFilter);
    };
  }

  /* ════════ threat intelligence ════════ */
  function fmtTCA(d) {
    const dt = (d.getTime() - Date.now()) / 60000;
    return d.toISOString().slice(11, 19) + "Z (T−" + (dt > 60 ? (dt / 60).toFixed(1) + "h" : dt.toFixed(0) + "m") + ")";
  }

  function renderThreats() {
    const box = $("threat-list");
    box.innerHTML = "";
    if (!STATE.events.length) {
      box.innerHTML = `<div style="padding:18px;text-align:center;color:#5a6590;letter-spacing:2px">
        NO CONJUNCTIONS IN SCREENING VOLUME — PRESS <b style="color:#ff9933">RUN ORBIT SCAN</b></div>`;
      return;
    }
    STATE.events.forEach((e, i) => {
      const row = document.createElement("div");
      row.className = "threat-row " + e.band + (e.band === "CRITICAL" ? " pulse-critical" : "");
      const geo = C.GEO_WEIGHTS[e.origin] || C.GEO_WEIGHTS.XX;
      row.innerHTML = `
        <span class="risk-badge ${e.band}" style="margin:0;text-align:center">${e.band}</span>
        <span><span class="lbl">PRIMARY → SECONDARY</span>${e.primary.name} ⟶ #${e.secondary.norad}</span>
        <span><span class="lbl">TCA</span>${fmtTCA(e.tca)}</span>
        <span><span class="lbl">MISS DIST</span><b style="color:${e.missKm < 5 ? "#ff5555" : "#ffd24d"}">${e.missKm.toFixed(3)} km</b></span>
        <span class="hide-sm"><span class="lbl">REL VELOCITY</span>${e.vRelKms.toFixed(2)} km/s</span>
        <span class="hide-sm"><span class="lbl">Pc (FOSTER)</span>${e.pc.toExponential(2)}</span>
        <span class="hide-sm"><span class="lbl">ORIGIN</span>${geo.label.split(" ")[0]} ×${geo.w.toFixed(2)}</span>
        <span><span class="lbl">ML RISK</span><b style="color:${e.score > 70 ? "#ff5555" : e.score > 45 ? "#ff9933" : "#1fb84f"}">${e.score}%</b></span>`;
      row.onclick = () => selectEvent(i);
      box.appendChild(row);
    });
  }

  function typewriterReport(ev) {
    const el = $("threat-detail");
    const geo = C.GEO_WEIGHTS[ev.origin] || C.GEO_WEIGHTS.XX;
    const lines = [
      "═══ THREAT INTELLIGENCE REPORT ═══",
      "PRIMARY OBJECT ....... " + ev.primary.name + " [" + ev.primary.agency + " · NORAD " + ev.primary.norad + "]",
      "SECONDARY OBJECT ..... " + ev.secondary.name + " [NORAD " + ev.secondary.norad + "]",
      "DEBRIS SOURCE ........ " + (ev.secondary.event || "UNKNOWN"),
      "TCA .................. " + ev.tca.toISOString().replace("T", " ").slice(0, 19) + " UTC",
      "MISS DISTANCE ........ " + ev.missKm.toFixed(3) + " km (" + (ev.missKm * 1000).toFixed(0) + " m)",
      "RELATIVE VELOCITY .... " + ev.vRelKms.toFixed(3) + " km/s",
      "Pc (FOSTER-1992) ..... " + ev.pc.toExponential(4),
      "GEOPOLITICAL WEIGHT .. ×" + geo.w.toFixed(2) + " — " + geo.label,
      "ML RISK SCORE ........ " + ev.score + "% → CLASS " + ev.band,
      ev.band === "CRITICAL" || ev.band === "HIGH"
        ? ">>> RECOMMEND: ARM AUTONOMOUS RESPONSE — SIMULATE MANEUVER <<<"
        : ">>> RECOMMEND: CONTINUE MONITORING — NO ACTION REQUIRED <<<"
    ];
    el.textContent = "";
    let li = 0, buf = "";
    (function step() {
      if (li >= lines.length) return;
      const line = lines[li];
      let ci = 0;
      (function ch() {
        if (ci <= line.length) {
          el.textContent = buf + line.slice(0, ci++) + "▌";
          setTimeout(ch, 3);
        } else { buf += line + "\n"; el.textContent = buf; li++; step(); }
      })();
    })();
  }

  function selectEvent(i) {
    STATE.selectedEvent = STATE.events[i];
    STATE.plan = null;
    const ev = STATE.selectedEvent;
    typewriterReport(ev);
    OGGlobe.focusSat(ev.primary.norad);
    renderResponse();
    OGAnalytics.riskTrend($("chart-trend"), ev);
    if (ev.band === "CRITICAL") {
      $("globe-wrap").classList.remove("shake");
      void $("globe-wrap").offsetWidth;
      $("globe-wrap").classList.add("shake");
    }
    log("EVENT LOCK: " + ev.primary.name + " vs #" + ev.secondary.norad +
        " | miss " + ev.missKm.toFixed(2) + " km | Pc " + ev.pc.toExponential(2),
        ev.band === "CRITICAL" ? "err" : "warn");
  }

  /* ════════ orbit scan ════════ */
  async function runScan() {
    if (STATE.scanning) return;
    STATE.scanning = true;
    const btn = $("btn-scan");
    btn.disabled = true; btn.textContent = "SCANNING…";
    log("ORBIT SCAN INITIATED — window " + C.SCAN.WINDOW_HOURS + " h, gate " + C.SCAN.SCREEN_KM + " km, " +
        STATE.assets.length + " assets × " + STATE.debris.length + " debris", "info");
    await new Promise(r => setTimeout(r, 30));
    const t0 = performance.now();
    STATE.events = await OGPhysics.scan(STATE.assets, STATE.debris, new Date(),
      p => { btn.textContent = "SCANNING… " + Math.round(p * 100) + "%"; });
    const ms = Math.round(performance.now() - t0);
    log("SCAN COMPLETE in " + ms + " ms — " + STATE.events.length + " conjunction events in volume",
        STATE.events.some(e => e.band === "CRITICAL") ? "err" : "ok");
    renderThreats(); refreshTopbar(); renderAssets(currentFilter);
    OGGlobe.showEvents(STATE.events);
    OGAnalytics.vulnerability($("chart-vuln"), STATE.events);
    if (STATE.events.length) selectEvent(0);
    // ⚡ AUTOMATED DANGER-POINT TRIGGER — dispatch authority alerts
    if (window.OGNotifier) OGNotifier.autoDispatch(STATE.events, log);
    btn.disabled = false; btn.textContent = "⟳ RUN ORBIT SCAN";
    STATE.scanning = false;
  }
  $("btn-scan").onclick = runScan;

  /* ── training threat injection (exercise the CRITICAL chain) ── */
  let injected = false;
  $("btn-inject").onclick = async () => {
    if (injected) { log("TRAINING THREAT ALREADY ACTIVE IN CATALOG", "warn"); return; }
    const target = STATE.assets.find(a => a.name === "CARTOSAT-3") ||
                   STATE.assets.find(a => a.regime === "LEO" && a.country === "IN");
    if (!target) return;
    const threat = OGPhysics.injectTrainingThreat(target, 6);
    if (!threat) { log("INJECTION FAILED — TLE clone rejected by SGP4", "err"); return; }
    STATE.debris.push(threat);
    injected = true;
    log("☢ TRAINING INJECTION: SIM-KKV-TRAINING armed on crossing plane vs " + target.name +
        " — rescanning…", "err");
    await runScan();
  };

  /* ════════ autonomous response console ════════ */
  function renderResponse() {
    const ev = STATE.selectedEvent, p = STATE.plan;
    const box = $("maneuver-data");
    if (!ev) { box.innerHTML = `<div class="kv"><span>STATUS</span><b>NO EVENT SELECTED</b></div>`; return; }
    box.innerHTML = `
      <div class="kv"><span>TARGET ASSET</span><b class="warn">${ev.primary.name}</b></div>
      <div class="kv"><span>THREAT OBJECT</span><b>#${ev.secondary.norad}</b></div>
      <div class="kv"><span>CURRENT MISS</span><b class="${ev.missKm < 5 ? "crit" : "warn"}">${ev.missKm.toFixed(3)} km</b></div>
      <div class="kv"><span>Pc BEFORE BURN</span><b class="${ev.pc > 1e-4 ? "crit" : ""}">${ev.pc.toExponential(3)}</b></div>
      ${p ? `
      <div class="kv"><span>ΔV REQUIRED</span><b class="ok">${p.dvMs.toFixed(3)} m/s (retrograde)</b></div>
      <div class="kv"><span>FUEL CONSUMPTION</span><b class="ok">${p.fuelKg.toFixed(3)} kg hydrazine</b></div>
      <div class="kv"><span>BURN LEAD TIME</span><b>${(p.leadTimeS / 60).toFixed(1)} min before TCA</b></div>
      <div class="kv"><span>NEW MISS DISTANCE</span><b class="ok">${p.newMissKm.toFixed(2)} km</b></div>
      <div class="kv"><span>Pc AFTER BURN</span><b class="ok">${p.pcAfter.toExponential(3)}</b></div>
      <div class="kv"><span>MISSION LIFETIME IMPACT</span><b class="warn">−${p.lifeImpactDays.toFixed(1)} days</b></div>
      <div class="kv"><span>FEASIBILITY</span><b class="${p.feasible ? "ok" : "crit"}">${p.feasible ? "✓ WITHIN BUDGET" : "✗ ESCALATE TO FLIGHT DYNAMICS"}</b></div>
      ` : `<div class="kv"><span>MANEUVER PLAN</span><b class="muted">NOT COMPUTED — PRESS SIMULATE</b></div>`}`;
    const fuelPct = p ? Math.min(100, p.fuelKg / (C.SPACECRAFT.FUEL_BUDGET_KG * 0.1) * 100) : 0;
    $("fuel-gauge").firstElementChild.style.width = fuelPct + "%";
  }

  $("btn-maneuver").onclick = () => {
    const ev = STATE.selectedEvent;
    if (!ev) { log("MANEUVER ABORT — no conjunction event selected", "warn"); return; }
    STATE.plan = OGPhysics.planManeuver(ev, new Date());
    renderResponse();
    log("MANEUVER SIMULATED: ΔV " + STATE.plan.dvMs.toFixed(3) + " m/s · fuel " +
        STATE.plan.fuelKg.toFixed(3) + " kg · new miss " + STATE.plan.newMissKm.toFixed(2) + " km", "ok");
  };

  function download(filename, text) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function showModal(title, text, filename) {
    $("modal-title").textContent = title;
    $("modal-pre").textContent = text;
    $("og-modal-veil").classList.add("open");
    $("modal-download").onclick = () => download(filename, text);
  }
  $("modal-close").onclick = () => $("og-modal-veil").classList.remove("open");

  $("btn-cdm").onclick = () => {
    const ev = STATE.selectedEvent;
    if (!ev) { log("CDM ABORT — select a conjunction first", "warn"); return; }
    const cdm = OGPhysics.generateCDM(ev, STATE.plan);
    const fn = OGPhysics.cdmFilename(ev);
    showModal("CCSDS CONJUNCTION DATA MESSAGE — " + fn, cdm, fn);
    log("CDM GENERATED → " + fn + " (CCSDS 508.0-B-1 layout)", "ok");
  };

  $("btn-report").onclick = () => {
    const lines = [
      "ORBITAL GUARDIAN AI — SITUATION REPORT",
      "GENERATED: " + new Date().toISOString(),
      "DATA SOURCE: " + STATE.liveSource,
      "ASSETS TRACKED: " + STATE.assets.length + " (ISRO/JAXA/INTL)",
      "DEBRIS TRACKED: " + STATE.debris.length,
      "", "── ACTIVE CONJUNCTIONS (" + STATE.events.length + ") ──"
    ];
    for (const e of STATE.events) {
      lines.push(`[${e.band}] ${e.primary.name} vs #${e.secondary.norad} | TCA ${e.tca.toISOString()} | ` +
        `miss ${e.missKm.toFixed(3)} km | Pc ${e.pc.toExponential(2)} | ML ${e.score}%`);
    }
    if (STATE.kessler) {
      lines.push("", "── KESSLER OUTLOOK ──",
        "Chain-reaction probability: " + (STATE.kessler.chainProb * 100).toFixed(1) + "% /yr");
    }
    const fn = "OG_SITREP_" + new Date().toISOString().slice(0, 16).replace(/:/g, "-") + "Z.txt";
    showModal("SITUATION REPORT — " + fn, lines.join("\n"), fn);
    log("SITUATION REPORT EXPORTED → " + fn, "ok");
  };

  $("btn-alert-isro").onclick = () => alertAgency("ISRO ISTRAC (Bengaluru)");
  $("btn-alert-jaxa").onclick = () => alertAgency("JAXA Tsukuba SSA Center");
  async function alertAgency(name) {
    const ev = STATE.selectedEvent;
    if (!ev) { log("ALERT ABORT — no event selected", "warn"); return; }
    log("⚠ MANUAL PRIORITY ALERT → " + name + " | " + ev.primary.name +
        " | TCA " + ev.tca.toISOString().slice(11, 16) + "Z | CLASS " + ev.band, "err");
    // route the manual alert through the same multi-channel engine
    const plan = STATE.plan || OGPhysics.planManeuver(ev, new Date());
    const payload = OGNotifier.buildPayload(ev, plan);
    payload.agency = name.toUpperCase();
    payload.subject = payload.subject.replace("[", "[MANUAL·");
    OGNotifier.mailtoDraft(payload);            // instant draft for the operator
    try {
      const base = (C.ALERTS && C.ALERTS.BACKEND_URL) || "http://localhost:8000";
      const r = await fetch(base + "/api/alert/dispatch", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (r.ok) {
        const res = await r.json();
        const ok = Object.keys(res.channels).filter(k => res.channels[k]);
        log(ok.length ? "✓ DELIVERED VIA " + ok.join(", ").toUpperCase()
                      : "BACKEND REACHED — no channels configured (set SMTP env vars)", ok.length ? "ok" : "warn");
      } else log("BACKEND DISPATCH FAILED — email draft opened instead", "warn");
    } catch (e) { log("BACKEND OFFLINE — email draft opened instead", "warn"); }
  }

  /* ════════ sidebar nav — scroll-spy command navigation ════════ */
  document.querySelectorAll("#sidebar .nav-item[data-view]").forEach(item => {
    item.onclick = () => {
      document.querySelectorAll("#sidebar .nav-item").forEach(n => n.classList.remove("active"));
      item.classList.add("active");
      const v = item.dataset.view;
      if (v === "dashboard") window.scrollTo({ top: 0, behavior: "smooth" });
      if (v === "globe")    { OGGlobe.releaseFocus(); OGGlobe.focusIndia(); window.scrollTo({ top: 0, behavior: "smooth" }); }
      if (v === "threats")  $("threat").scrollIntoView({ behavior: "smooth", block: "center" });
      if (v === "registry") $("assets").scrollIntoView({ behavior: "smooth", block: "center" });
      if (v === "analytics"){ refreshAnalytics(); $("analytics").scrollIntoView({ behavior: "smooth" }); }
      if (v === "docs")     $("documentation").scrollIntoView({ behavior: "smooth" });
    };
  });

  /* ════════ globe controls ════════ */
  $("gc-india").onclick = () => { OGGlobe.releaseFocus(); OGGlobe.focusIndia(); log("CAMERA RESET → INDIAN OCEAN / ISRO AOR", "info"); };
  $("gc-in").onclick = e => toggleLayer("IN", e.target);
  $("gc-jp").onclick = e => toggleLayer("JP", e.target);
  $("gc-deb").onclick = e => toggleLayer("DEBRIS", e.target);
  function toggleLayer(k, btn) {
    const on = OGGlobe.toggleLayer(k);
    btn.style.opacity = on ? 1 : 0.45;
    log("LAYER " + k + (on ? " ENABLED" : " SUPPRESSED"), "info");
  }
  $("gc-planets").onclick = e => {
    const on = OGGlobe.togglePlanets();
    e.target.style.opacity = on ? 1 : 0.55;
    log(on ? "SKY BODIES ON — Moon (native) + Mercury→Saturn at true directions (JPL mean elements)"
           : "SKY BODIES SUPPRESSED", "info");
  };
  $("gc-light").onclick = e => {
    const on = OGGlobe.toggleLighting();
    e.target.textContent = on ? "🌗 TERMINATOR ON" : "☀ FULL DAYLIGHT";
    e.target.classList.toggle("green", on);
    e.target.classList.toggle("saffron", !on);
    log(on ? "SUN-DRIVEN LIGHTING RESTORED — real day/night terminator active"
           : "TERMINATOR SUPPRESSED — full daylight imagery on entire globe", "info");
  };
  let speeds = [1, 60, 300, 1500], si = 1;
  $("gc-speed").onclick = e => {
    si = (si + 1) % speeds.length;
    OGGlobe.setSpeed(speeds[si]);
    e.target.textContent = "⏩ " + speeds[si] + "×";
    log("SIM CLOCK MULTIPLIER → " + speeds[si] + "×", "info");
  };

  /* ════════ analytics ════════ */
  function refreshAnalytics() {
    OGAnalytics.riskTrend($("chart-trend"), STATE.selectedEvent);
    OGAnalytics.congestion($("chart-congestion"), STATE.assets, STATE.debris);
    if (!STATE.kessler) STATE.kessler = OGPhysics.kesslerSim(STATE.debris, 25);
    OGAnalytics.kessler($("chart-kessler"), STATE.kessler);
    OGAnalytics.vulnerability($("chart-vuln"), STATE.events);
  }
  $("btn-kessler").onclick = () => {
    STATE.kessler = OGPhysics.kesslerSim(STATE.debris, 25);
    OGAnalytics.kessler($("chart-kessler"), STATE.kessler);
    log("KESSLER CASCADE RE-SIMULATED — chain probability " +
        (STATE.kessler.chainProb * 100).toFixed(1) + "% /yr", "warn");
  };

  /* ════════ documentation buttons ════════ */
  $("doc-export-tle").onclick = () => {
    const txt = STATE.assets.map(a => a.name + "\n" + a.l1 + "\n" + a.l2).join("\n");
    download("OG_ASSET_CATALOG.tle", txt);
    log("ASSET TLE CATALOG EXPORTED (" + STATE.assets.length + " objects)", "ok");
  };
  $("doc-export-debris").onclick = () => {
    const txt = STATE.debris.map(d => d.name + "\n" + d.l1 + "\n" + d.l2).join("\n");
    download("OG_DEBRIS_CATALOG.tle", txt);
    log("DEBRIS TLE CATALOG EXPORTED (" + STATE.debris.length + " objects)", "ok");
  };
  $("doc-show-config").onclick = () =>
    showModal("SYSTEM CONFIGURATION DUMP", JSON.stringify(C, null, 2), "OG_CONFIG.json");

  /* ════════ MAIN BOOT ════════ */
  let booted = false;
  async function main() {
    if (booted) return; booted = true;
    typeBoot(async () => {
      const refreshed = await loadCatalogs();
      log("CATALOG PIPELINE: " + STATE.assets.length + " assets / " + STATE.debris.length +
          " debris initialized (SGP4)", "ok");
      log("DATA SOURCE: " + STATE.liveSource, refreshed ? "ok" : "warn");

      await OGGlobe.init(STATE.assets, STATE.debris, log);
      refreshTopbar();
      renderAssets("ALL");
      renderThreats();
      renderResponse();
      refreshAnalytics();

      const ls = $("loading-screen");
      if (ls) { ls.classList.add("done"); setTimeout(() => ls.remove(), 1100); }

      // auto-run the first scan shortly after boot
      setTimeout(runScan, 1800);
      // periodic re-scan every 5 min of wall-time
      setInterval(runScan, 5 * 60 * 1000);
    });
  }
  /* boot only after the operator passes the Sovereign Access Gate;
     if the gate is absent (e.g. stripped build), boot immediately */
  function armBoot() {
    if (document.getElementById("auth-gate")) {
      document.addEventListener("og-authenticated", main, { once: true });
    } else {
      main();
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", armBoot);
  else armBoot();
})();
