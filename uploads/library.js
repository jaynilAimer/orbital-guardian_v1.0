/* ============================================================
   ORBITAL GUARDIAN AI — ANALYTICS CORE
   Pure-canvas charting (zero external chart deps):
     · Risk-trend line graph (Pc over screening window)
     · Orbital congestion histogram (objects vs altitude)
     · Kessler cascade heatmap (shell × year density)
     · Vulnerability ranking bars
   ============================================================ */
(function () {
  "use strict";
  const A = {};
  window.OGAnalytics = A;

  function prep(cv) {
    const dpr = window.devicePixelRatio || 1;
    cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr;
    const ctx = cv.getContext("2d");
    ctx.scale(dpr, dpr);
    const w = cv.clientWidth, h = cv.clientHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.font = "9px JetBrains Mono, monospace";
    return { ctx, w, h };
  }
  function grid(ctx, w, h, pad) {
    ctx.strokeStyle = "rgba(0,212,255,0.1)"; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad + (h - 2 * pad) * i / 4;
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
    }
  }

  /* — Risk trend: separation distance of worst event over window — */
  A.riskTrend = function (cv, ev) {
    const { ctx, w, h } = prep(cv); const pad = 30;
    grid(ctx, w, h, pad);
    if (!ev) { ctx.fillStyle = "#5a6590"; ctx.fillText("NO ACTIVE CONJUNCTION — RUN ORBIT SCAN", pad, h / 2); return; }
    const t0 = ev.tca.getTime() - 45 * 60000, t1 = ev.tca.getTime() + 45 * 60000;
    const pts = [];
    for (let t = t0; t <= t1; t += 60000) {
      const pa = OGPhysics.eciAt(ev.primary, new Date(t));
      const pb = OGPhysics.eciAt(ev.secondary, new Date(t));
      if (!pa || !pb) continue;
      pts.push({ t, d: OGPhysics.mag(OGPhysics.sub(pa.position, pb.position)) });
    }
    const dMax = Math.max(...pts.map(p => p.d));
    const X = t => pad + (w - 2 * pad) * (t - t0) / (t1 - t0);
    const Y = d => h - pad - (h - 2 * pad) * Math.min(1, d / dMax);
    // danger band <5 km
    ctx.fillStyle = "rgba(255,34,34,0.10)";
    ctx.fillRect(pad, Y(5), w - 2 * pad, (h - pad) - Y(5));
    ctx.strokeStyle = "#ff9933"; ctx.lineWidth = 1.6; ctx.shadowColor = "#ff9933"; ctx.shadowBlur = 6;
    ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(X(p.t), Y(p.d)) : ctx.moveTo(X(p.t), Y(p.d)));
    ctx.stroke(); ctx.shadowBlur = 0;
    // TCA marker
    ctx.strokeStyle = "rgba(255,34,34,0.85)"; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(X(ev.tca.getTime()), pad); ctx.lineTo(X(ev.tca.getTime()), h - pad); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#ff5555";
    ctx.fillText("TCA " + ev.tca.toISOString().slice(11, 19) + "Z", X(ev.tca.getTime()) + 4, pad + 10);
    ctx.fillStyle = "#8a93b0";
    ctx.fillText("SEPARATION km — " + ev.primary.name + " vs #" + ev.secondary.norad, pad, 12);
    ctx.fillText("0", pad - 10, h - pad + 3);
    ctx.fillText(dMax.toFixed(0), 4, pad + 3);
  };

  /* — Congestion histogram: tracked objects per 100-km bin — */
  A.congestion = function (cv, assets, debris) {
    const { ctx, w, h } = prep(cv); const pad = 30;
    const bins = new Array(20).fill(0), binKm = 100;
    for (const o of debris) if (o.satrec && o.perigeeKm > 0) {
      const b = Math.floor(((o.perigeeKm + o.apogeeKm) / 2) / binKm);
      if (b >= 0 && b < bins.length) bins[b]++;
    }
    const aBins = new Array(20).fill(0);
    for (const o of assets) if (o.satrec) {
      const b = Math.floor(((o.perigeeKm + o.apogeeKm) / 2) / binKm);
      if (b >= 0 && b < aBins.length) aBins[b]++;
    }
    const mx = Math.max(...bins, 1);
    const bw = (w - 2 * pad) / bins.length;
    grid(ctx, w, h, pad);
    bins.forEach((n, i) => {
      const bh = (h - 2 * pad) * n / mx;
      const x = pad + i * bw;
      const g = ctx.createLinearGradient(0, h - pad - bh, 0, h - pad);
      g.addColorStop(0, "#ff5544"); g.addColorStop(1, "#3a1020");
      ctx.fillStyle = g; ctx.fillRect(x + 1, h - pad - bh, bw - 2, bh);
      if (aBins[i]) {                                  // our assets in this band
        ctx.fillStyle = "#ff9933"; ctx.shadowColor = "#ff9933"; ctx.shadowBlur = 6;
        ctx.fillRect(x + 1, h - pad - bh - 6, bw - 2, 3); ctx.shadowBlur = 0;
      }
    });
    ctx.fillStyle = "#8a93b0";
    ctx.fillText("TRACKED DEBRIS DENSITY vs MEAN ALTITUDE (×100 km) — saffron tick = ISRO/JAXA asset band", pad, 12);
    for (let i = 0; i <= 4; i++) ctx.fillText((i * 5) + "", pad + i * 5 * bw - 3, h - pad + 12);
    ctx.fillText("PEAK BIN: " + mx + " obj — Fengyun-1C corridor 750–900 km", pad, h - 4);
  };

  /* — Kessler heatmap: shells × years — */
  A.kessler = function (cv, sim) {
    const { ctx, w, h } = prep(cv); const padL = 86, padT = 22, padB = 24, padR = 12;
    const rows = sim.shells.length, cols = sim.grid.length;
    const cw = (w - padL - padR) / cols, ch = (h - padT - padB) / rows;
    let mx = 0;
    for (const row of sim.grid) for (const v of row) mx = Math.max(mx, v);
    for (let y = 0; y < cols; y++) {
      for (let s = 0; s < rows; s++) {
        const v = sim.grid[y][s] / mx;
        const r = Math.floor(20 + 235 * Math.pow(v, 0.5));
        const g = Math.floor(20 + 90 * Math.pow(v, 1.4));
        ctx.fillStyle = `rgb(${r},${g},${30 + 30 * (1 - v)})`;
        ctx.fillRect(padL + y * cw, padT + s * ch, cw + 0.5, ch - 1);
      }
    }
    ctx.fillStyle = "#8a93b0";
    sim.shells.forEach((sh, i) => ctx.fillText(sh.name, 4, padT + i * ch + ch / 2 + 3));
    for (let y = 0; y <= sim.years; y += 5)
      ctx.fillText("+" + y + "y", padL + y * cw - 4, h - 8);
    ctx.fillStyle = "#ff9933";
    ctx.fillText("KESSLER CASCADE PROPAGATION — fragment population index per shell", padL, 12);
    ctx.fillStyle = sim.chainProb > 0.3 ? "#ff5555" : "#1fb84f";
    ctx.fillText("CHAIN-REACTION PROBABILITY SCORE: " + (sim.chainProb * 100).toFixed(1) + "% /yr (LEO<1000 km)", padL, h - 8 + 0);
  };

  /* — Vulnerability ranking — */
  A.vulnerability = function (cv, events) {
    const { ctx, w, h } = prep(cv); const pad = 16;
    const agg = new Map();
    for (const e of events) {
      const k = e.primary.name;
      agg.set(k, Math.max(agg.get(k) || 0, e.score));
    }
    const rows = [...agg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (!rows.length) { ctx.fillStyle = "#5a6590"; ctx.fillText("NO RANKED THREATS — RUN ORBIT SCAN", pad, h / 2); return; }
    const rh = Math.min(22, (h - 30) / rows.length);
    ctx.fillStyle = "#8a93b0"; ctx.fillText("SATELLITE VULNERABILITY RANKING (max ML risk %)", pad, 12);
    rows.forEach(([name, sc], i) => {
      const y = 24 + i * rh;
      const bw = (w - 150) * sc / 100;
      const col = sc > 70 ? "#ff4444" : sc > 45 ? "#ff9933" : "#1fb84f";
      ctx.fillStyle = "#cfd6ee"; ctx.fillText(name.slice(0, 18), pad, y + 10);
      const g = ctx.createLinearGradient(140, 0, 140 + bw, 0);
      g.addColorStop(0, "#222a55"); g.addColorStop(1, col);
      ctx.fillStyle = g; ctx.shadowColor = col; ctx.shadowBlur = 5;
      ctx.fillRect(140, y + 2, bw, rh - 8); ctx.shadowBlur = 0;
      ctx.fillStyle = col; ctx.fillText(sc + "%", 144 + bw, y + 10);
    });
  };
})();
