/* ============================================================
   ORBITAL GUARDIAN AI — PHYSICS / INTELLIGENCE CORE
   - SGP4 propagation         (satellite.js, Vallado)
   - Conjunction screening    (coarse gate → golden refine)
   - Foster 2-D Pc model      (documented assumptions)
   - ML-style risk scoring    (feature-weighted heuristic)
   - Maneuver optimizer       (along-track Δv, Tsiolkovsky fuel)
   - Kessler cascade model    (per-shell density propagation)
   ============================================================ */
(function () {
  "use strict";
  const C = window.OG_CONFIG;
  const Physics = {};
  window.OGPhysics = Physics;

  /* ── TLE bookkeeping ─────────────────────────────────────── */
  Physics.initSatrec = function (obj) {
    try {
      obj.satrec = satellite.twoline2satrec(obj.l1, obj.l2);
      if (obj.satrec.error) return false;
      // orbital quick-facts from mean elements
      const n = obj.satrec.no_kozai ?? obj.satrec.no;     // rad/min (field name differs across satellite.js builds)
      if (!n || isNaN(n)) return false;
      const a = Math.pow(C.PHYSICS.MU_EARTH / Math.pow(n / 60, 2), 1 / 3); // km
      const e = obj.satrec.ecco;
      obj.periodMin = (2 * Math.PI) / n;
      obj.apogeeKm  = a * (1 + e) - 6371;
      obj.perigeeKm = a * (1 - e) - 6371;
      obj.incDeg    = obj.satrec.inclo * 180 / Math.PI;
      obj.regime    = obj.apogeeKm > 30000 ? "GEO" : obj.apogeeKm > 2000 ? "MEO" : "LEO";
      return true;
    } catch (e) { return false; }
  };

  Physics.eciAt = function (obj, date) {
    const pv = satellite.propagate(obj.satrec, date);
    if (!pv || !pv.position || isNaN(pv.position.x)) return null;
    return pv; // { position {x,y,z} km ECI, velocity km/s }
  };

  Physics.parseTLE = function (text) {
    const out = [];
    const lines = text.split(/\r?\n/).map(s => s.trimEnd()).filter(Boolean);
    for (let i = 0; i + 2 < lines.length + 1; i++) {
      if (lines[i + 1] && lines[i + 1].startsWith("1 ") && lines[i + 2] && lines[i + 2].startsWith("2 ")) {
        out.push({ name: lines[i].trim(), l1: lines[i + 1], l2: lines[i + 2], norad: parseInt(lines[i + 1].slice(2, 7), 10) });
        i += 2;
      }
    }
    return out;
  };

  /* ── relative geometry ───────────────────────────────────── */
  function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
  function mag(v) { return Math.hypot(v.x, v.y, v.z); }
  Physics.sub = sub; Physics.mag = mag;

  function sepAt(a, b, date) {
    const pa = Physics.eciAt(a, date), pb = Physics.eciAt(b, date);
    if (!pa || !pb) return null;
    return { d: mag(sub(pa.position, pb.position)),
             vRel: mag(sub(pa.velocity, pb.velocity)),
             pa, pb };
  }

  /* ── Foster 2-D collision probability ────────────────────────
     Encounter-plane model. Combined covariance projected onto
     B-plane with σ_x (radial-ish) and σ_y (in-track-ish). Miss
     vector assumed split evenly between axes (worst-reasonable).
     Pc ≈ HBR² / (2 σx σy) · exp( −¼ d² (1/σx² + 1/σy²) )      */
  Physics.fosterPc = function (dKm) {
    const sx = C.PHYSICS.SIGMA_RADIAL_M / 1000;
    const sy = C.PHYSICS.SIGMA_INTRACK_M / 1000;
    const R = C.PHYSICS.HBR_M / 1000;
    const pc = (R * R / (2 * sx * sy)) *
      Math.exp(-0.25 * dKm * dKm * (1 / (sx * sx) + 1 / (sy * sy)));
    return Math.min(pc, 1);
  };

  /* ── risk model (ML-style weighted features → 0–100) ─────── */
  Physics.riskScore = function (ev) {
    const pcTerm   = Math.min(1, Math.max(0, (Math.log10(Math.max(ev.pc, 1e-12)) + 12) / 12)); // 1e-12..1 → 0..1
    const distTerm = Math.exp(-ev.missKm / 8);
    const velTerm  = Math.min(1, ev.vRelKms / 15);
    const geo      = (C.GEO_WEIGHTS[ev.origin] || C.GEO_WEIGHTS.XX).w;
    const raw = (0.46 * pcTerm + 0.34 * distTerm + 0.20 * velTerm) * geo;
    return Math.round(Math.min(0.99, raw) * 100);
  };

  Physics.riskBand = function (missKm) {
    for (const b of C.RISK_BANDS) if (missKm <= b.maxKm) return b.id;
    return "LOW";
  };

  /* ── conjunction screening ───────────────────────────────────
     1. altitude-band gate (apogee/perigee overlap ± pad)
     2. coarse sweep, COARSE_STEP_S over WINDOW_HOURS
        — each object propagated ONCE per step (cached),
        — async: yields to the event loop every few steps
     3. fine refinement around each coarse minimum            */
  Physics.scan = async function (assets, debris, t0, onProgress) {
    const S = C.SCAN;
    const events = [];
    const steps = Math.floor(S.WINDOW_HOURS * 3600 / S.COARSE_STEP_S);
    const pad = S.BAND_PAD_KM;

    // candidate pairs by altitude-band overlap
    const pairs = [];
    const involved = new Set();
    for (const a of assets) {
      if (!a.satrec || a.regime === "GEO") continue;     // GEO↔LEO debris never gates
      for (const d of debris) {
        if (!d.satrec) continue;
        if (d.perigeeKm - pad > a.apogeeKm || d.apogeeKm + pad < a.perigeeKm) continue;
        pairs.push([a, d]);
        involved.add(a); involved.add(d);
      }
    }
    const objs = [...involved];

    // coarse sweep — propagate every involved object once per step
    const best = new Map();
    const pos = new Map();
    for (let s = 0; s <= steps; s++) {
      const t = new Date(t0.getTime() + s * S.COARSE_STEP_S * 1000);
      pos.clear();
      for (const o of objs) {
        const pv = Physics.eciAt(o, t);
        if (pv) pos.set(o, pv);
      }
      for (let p = 0; p < pairs.length; p++) {
        const pa = pos.get(pairs[p][0]), pb = pos.get(pairs[p][1]);
        if (!pa || !pb) continue;
        const dx = pa.position.x - pb.position.x;
        const dy = pa.position.y - pb.position.y;
        const dz = pa.position.z - pb.position.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < S.SCREEN_KM * S.SCREEN_KM) {
          const d = Math.sqrt(d2);
          const cur = best.get(p);
          if (!cur || d < cur.d)
            best.set(p, { d, t, vRel: mag(sub(pa.velocity, pb.velocity)) });
        }
      }
      if (s % 25 === 0) {
        if (onProgress) onProgress(s / steps);
        await new Promise(r => setTimeout(r, 0));        // keep UI alive
      }
    }

    // refine each candidate with fine stepping
    for (const [p, coarse] of best.entries()) {
      const [a, d] = pairs[p];
      let lo = coarse.t.getTime() - S.REFINE_HALF_S * 1000;
      let hi = coarse.t.getTime() + S.REFINE_HALF_S * 1000;
      let bestD = Infinity, bestT = coarse.t, bestV = coarse.vRel;
      for (let tm = lo; tm <= hi; tm += S.REFINE_STEP_S * 1000) {
        const r = sepAt(a, d, new Date(tm));
        if (r && r.d < bestD) { bestD = r.d; bestT = new Date(tm); bestV = r.vRel; }
      }
      const ev = {
        primary: a, secondary: d,
        tca: bestT, missKm: bestD, vRelKms: bestV,
        pc: Physics.fosterPc(bestD),
        origin: d.origin || "XX",
        band: null, score: 0
      };
      ev.band = Physics.riskBand(bestD);
      ev.score = Physics.riskScore(ev);
      events.push(ev);
    }

    events.sort((x, y) => x.missKm - y.missKm);
    return events.slice(0, S.MAX_EVENTS);
  };

  /* ── maneuver optimizer ──────────────────────────────────────
     Along-track Δv applied at lead-time τ displaces the s/c by
     Δx ≈ 3·Δv·τ along-track (Clohessy–Wiltshire secular drift).
     Δv = required extra miss / (3τ); fuel via Tsiolkovsky.     */
  Physics.planManeuver = function (ev, now) {
    const SC = C.SPACECRAFT;
    const tau = Math.max(600, (ev.tca.getTime() - now.getTime()) / 1000); // ≥10 min
    const needKm = Math.max(0, SC.TARGET_MISS_KM - ev.missKm);
    const dvMs = (needKm * 1000) / (3 * tau);
    const ve = SC.ISP_S * SC.G0;
    const fuelKg = SC.MASS_KG * (1 - Math.exp(-dvMs / ve));
    const newMiss = ev.missKm + (3 * dvMs * tau) / 1000;
    const lifeImpactDays = (fuelKg / SC.FUEL_BUDGET_KG) * 365 * 2;  // 2-yr fuel-limited margin
    const pcAfter = Physics.fosterPc(newMiss);
    return {
      leadTimeS: tau, dvMs, fuelKg, newMissKm: newMiss,
      pcBefore: ev.pc, pcAfter, lifeImpactDays,
      feasible: fuelKg < SC.FUEL_BUDGET_KG * 0.1 && dvMs < 5
    };
  };

  /* ── Kessler cascade model ───────────────────────────────────
     Shell populations N_i; collision rate ∝ N²·σ·v/V_shell;
     each collision spawns k fragments; iterate years.          */
  Physics.kesslerSim = function (debris, years = 25) {
    const shells = [
      { name: "LEO 400-600",   lo: 400,  hi: 600 },
      { name: "LEO 600-800",   lo: 600,  hi: 800 },
      { name: "LEO 800-1000",  lo: 800,  hi: 1000 },
      { name: "LEO 1000-1400", lo: 1000, hi: 1400 },
      { name: "MEO",           lo: 1400, hi: 30000 },
      { name: "GEO",           lo: 30000, hi: 50000 }
    ];
    // seed counts: real tracked sample scaled to catalog estimate (×40)
    for (const sh of shells) {
      sh.n = debris.filter(d => d.satrec && d.perigeeKm < sh.hi && d.apogeeKm > sh.lo).length * 40 + 50;
    }
    const sigma = 4e-6;            // km² effective cross-section
    const vAvg = 10;               // km/s mean relative velocity in LEO
    const k = 120;                 // fragments per catastrophic collision
    const grid = [];               // [shellIdx][year] = density index
    let chainProb = 0;
    for (let y = 0; y <= years; y++) {
      const row = [];
      for (const sh of shells) {
        const vol = (4 / 3) * Math.PI * (Math.pow(6371 + sh.hi, 3) - Math.pow(6371 + sh.lo, 3));
        const rate = sh.n * sh.n * sigma * vAvg * 3.15e7 / (2 * vol); // collisions / yr
        sh.n += rate * k - sh.n * 0.012;        // fragment gain − drag decay
        row.push(sh.n);
        if (sh.lo < 1000) chainProb = Math.max(chainProb, Math.min(0.99, rate * 3));
      }
      grid.push(row);
    }
    return { shells, grid, years, chainProb };
  };

  /* ── training-threat injection ───────────────────────────────
     Clones a real asset's TLE and tilts its inclination by Δi.
     Both orbits then share the line of nodes at equal radius, so
     genuine high-velocity close approaches occur each node pass.
     Output is REAL SGP4 — only the object itself is synthetic.  */
  function tleChecksum(line) {
    let s = 0;
    for (const ch of line.slice(0, 68)) {
      if (ch >= "0" && ch <= "9") s += +ch;
      else if (ch === "-") s += 1;
    }
    return s % 10;
  }
  Physics.injectTrainingThreat = function (asset, dIncDeg = 4) {
    function build(dM) {
      let l1 = "1 99999U 26900A   " + asset.l1.slice(18, 68);   // prefix = 18 cols, epoch aligned
      l1 = l1.slice(0, 68) + tleChecksum(l1);
      const inc = (asset.satrec.inclo * 180 / Math.PI + dIncDeg).toFixed(4).padStart(8, " ");
      const M0 = parseFloat(asset.l2.slice(43, 51));
      const M = ((M0 + dM) % 360 + 360) % 360;
      let l2 = "2 99999 " + inc + asset.l2.slice(16, 43) +
               M.toFixed(4).padStart(8, " ") + asset.l2.slice(51, 68);
      l2 = l2.slice(0, 68) + tleChecksum(l2);
      const o = { name: "SIM-KKV-TRAINING", norad: 99999, l1, l2,
        origin: "CN",
        event: "⚠ TRAINING INJECTION — SIMULATED ASAT FRAGMENT (crossing-plane clone of " + asset.name + ")" };
      return Physics.initSatrec(o) ? o : null;
    }
    // phase-tune mean anomaly so the node crossing yields a sub-km miss
    const now = Date.now();
    function minMiss(threat, hours) {
      let mn = 1e9;
      for (let t = 0; t < hours * 3600; t += 5) {
        const d = new Date(now + t * 1000);
        const a = Physics.eciAt(asset, d), b = Physics.eciAt(threat, d);
        if (!a || !b) continue;
        const dd = Math.hypot(a.position.x - b.position.x,
                              a.position.y - b.position.y,
                              a.position.z - b.position.z);
        if (dd < mn) mn = dd;
      }
      return mn;
    }
    let bestObj = null, bestD = 1e9, bestdM = 0;
    for (let dM = -1.0; dM <= 1.0; dM += 0.05) {          // coarse phase search
      const th = build(dM); if (!th) continue;
      const d = minMiss(th, 3);
      if (d < bestD) { bestD = d; bestObj = th; bestdM = dM; }
    }
    for (let dM = bestdM - 0.05; dM <= bestdM + 0.05; dM += 0.004) {  // fine phase trim
      const th = build(dM); if (!th) continue;
      const d = minMiss(th, 3);
      if (d < bestD) { bestD = d; bestObj = th; }
    }
    if (bestObj) bestObj.event += " | tuned miss " + bestD.toFixed(2) + " km";
    return bestObj;
  };

  /* ── CCSDS CDM generator ─────────────────────────────────── */
  Physics.generateCDM = function (ev, plan) {
    const P = C.PHYSICS;
    const iso = d => d.toISOString().replace(/\.\d+Z/, "Z");
    const id = "OG-" + Date.now().toString(36).toUpperCase();
    return [
      "CCSDS_CDM_VERS               = 1.0",
      "CREATION_DATE                = " + iso(new Date()),
      "ORIGINATOR                   = ORBITAL_GUARDIAN_AI",
      "MESSAGE_FOR                  = ISRO_ISTRAC / JAXA_JSPOC",
      "MESSAGE_ID                   = " + id,
      "",
      "TCA                          = " + iso(ev.tca),
      "MISS_DISTANCE                = " + (ev.missKm * 1000).toFixed(1) + " [m]",
      "RELATIVE_SPEED               = " + (ev.vRelKms * 1000).toFixed(1) + " [m/s]",
      "COLLISION_PROBABILITY        = " + ev.pc.toExponential(4),
      "COLLISION_PROBABILITY_METHOD = FOSTER-1992",
      "",
      "COMMENT  Screening volume: " + C.SCAN.SCREEN_KM + " km gate, " + C.SCAN.WINDOW_HOURS + " h window",
      "COMMENT  Combined HBR " + P.HBR_M + " m | sigma_R " + P.SIGMA_RADIAL_M + " m | sigma_I " + P.SIGMA_INTRACK_M + " m",
      "COMMENT  ML_RISK_SCORE = " + ev.score + "% | CLASS = " + ev.band,
      "COMMENT  GEOPOLITICAL_ORIGIN = " + ((C.GEO_WEIGHTS[ev.origin] || {}).label || "UNKNOWN"),
      "",
      "OBJECT                       = OBJECT1",
      "OBJECT_DESIGNATOR            = " + ev.primary.norad,
      "OBJECT_NAME                  = " + ev.primary.name,
      "CATALOG_NAME                 = SATCAT",
      "OPERATOR_ORGANIZATION        = " + (ev.primary.agency || "ISRO"),
      "MANEUVERABLE                 = YES",
      "ORBIT_REGIME                 = " + ev.primary.regime,
      "",
      "OBJECT                       = OBJECT2",
      "OBJECT_DESIGNATOR            = " + ev.secondary.norad,
      "OBJECT_NAME                  = " + ev.secondary.name,
      "CATALOG_NAME                 = SATCAT",
      "OBJECT_TYPE                  = DEBRIS",
      "DEBRIS_SOURCE_EVENT          = " + (ev.secondary.event || "UNKNOWN"),
      "MANEUVERABLE                 = NO",
      "",
      plan ? [
        "COMMENT  --- RECOMMENDED ACTION (AUTONOMOUS RESPONSE ENGINE) ---",
        "RECOMMENDED_ACTION           = ALONG_TRACK_RETROGRADE_BURN",
        "DELTA_V                      = " + plan.dvMs.toFixed(3) + " [m/s]",
        "FUEL_REQUIRED                = " + plan.fuelKg.toFixed(3) + " [kg]",
        "POST_MANEUVER_MISS_DISTANCE  = " + (plan.newMissKm * 1000).toFixed(0) + " [m]",
        "POST_MANEUVER_PC             = " + plan.pcAfter.toExponential(3),
        "BURN_LEAD_TIME               = " + (plan.leadTimeS / 60).toFixed(1) + " [min]"
      ].join("\n") : "RECOMMENDED_ACTION           = MONITOR",
      ""
    ].join("\n");
  };

  Physics.cdmFilename = function (ev) {
    const s1 = ev.primary.name.replace(/[^A-Z0-9]/gi, "").slice(0, 12);
    const s2 = ("DEBRIS" + ev.secondary.norad);
    const ts = ev.tca.toISOString().slice(0, 16).replace(/:/g, "-") + "Z";
    return `CDM_${s1}_${s2}_${ts}.txt`;
  };
})();
