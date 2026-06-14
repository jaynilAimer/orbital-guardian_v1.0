/* ════════════════════════════════════════════════════════════════
   SAFFRON COSMOS — SKEUOMORPHIC SPACE COMMAND UI
   Orbital Guardian AI · Theme Engine
   ════════════════════════════════════════════════════════════════ */

:root {
  --deep-space:   #0a0e1a;
  --void:         #05070f;
  --ashoka-navy:  #000080;
  --navy-panel:   #0c1230;
  --navy-edge:    #1b2a6b;
  --saffron:      #ff9933;
  --saffron-deep: #ff6600;
  --indigo:       #6a0dad;
  --indigo-deep:  #4B0082;
  --cyan:         #00d4ff;
  --cyan-dim:     rgba(0,212,255,.45);
  --red:          #ff2222;
  --green:        #1fb84f;
  --amber:        #ffd24d;
  --pearl:        #f5f5f5;
  --steel:        #8a93b0;
  --mono: "JetBrains Mono","Cascadia Code","Consolas","Courier New",monospace;
}

* { margin:0; padding:0; box-sizing:border-box; }

html, body {
  height:100%;
  background:var(--void);
  color:var(--pearl);
  font-family:var(--mono);
  font-size:13px;
  overflow-x:hidden;
}

::-webkit-scrollbar { width:8px; height:8px; }
::-webkit-scrollbar-track { background:#070a16; }
::-webkit-scrollbar-thumb {
  background:linear-gradient(180deg,#23306b,#101737);
  border-radius:4px; border:1px solid #00d4ff33;
}

::selection { background:var(--saffron); color:#000; }

/* ── starfield backdrop behind everything ───────────────────── */
body::before {
  content:""; position:fixed; inset:0; z-index:-1;
  background:
    radial-gradient(1px 1px at 12% 22%, #ffffffcc 50%, transparent 51%),
    radial-gradient(1px 1px at 67% 11%, #aaccffaa 50%, transparent 51%),
    radial-gradient(1.5px 1.5px at 33% 71%, #ffffff88 50%, transparent 51%),
    radial-gradient(1px 1px at 88% 49%, #ffd9aa99 50%, transparent 51%),
    radial-gradient(1px 1px at 51% 88%, #ffffff77 50%, transparent 51%),
    radial-gradient(2px 2px at 78% 81%, #88bbff66 50%, transparent 51%),
    radial-gradient(1px 1px at 21% 54%, #ffffff99 50%, transparent 51%),
    radial-gradient(ellipse at 50% 120%, #0d1430 0%, var(--void) 60%);
}

/* ════════════════════════════════════════════════════════════
   SKEUOMORPHIC PANEL SYSTEM — obsidian glass + metallic bezels
   ════════════════════════════════════════════════════════════ */
.og-panel {
  position:relative;
  background:
    linear-gradient(160deg, rgba(20,28,64,.92) 0%, rgba(8,12,30,.96) 55%, rgba(13,18,44,.92) 100%);
  border:1px solid #2a3a7a;
  border-radius:10px;
  box-shadow:
    inset 0 1px 0 rgba(160,190,255,.18),          /* top bevel highlight */
    inset 0 -2px 6px rgba(0,0,0,.65),             /* bottom console inset */
    inset 2px 0 4px rgba(0,0,0,.3),
    0 0 0 1px rgba(0,0,0,.8),
    0 6px 18px rgba(0,0,0,.6),
    0 0 22px rgba(0,212,255,.06);
  backdrop-filter: blur(7px);
}
.og-panel::before {                                /* brushed-metal frame strip */
  content:""; position:absolute; inset:0; border-radius:10px; pointer-events:none;
  background:linear-gradient(115deg, transparent 30%, rgba(255,255,255,.045) 38%, transparent 46%);
}

/* rivet screws on panel corners */
.og-rivets::after {
  content:""; position:absolute; inset:6px; pointer-events:none; border-radius:6px;
  background:
    radial-gradient(circle 3px at 4px 4px,     #67718f 30%, #11152b 75%, transparent 76%),
    radial-gradient(circle 3px at calc(100% - 4px) 4px, #67718f 30%, #11152b 75%, transparent 76%),
    radial-gradient(circle 3px at 4px calc(100% - 4px), #67718f 30%, #11152b 75%, transparent 76%),
    radial-gradient(circle 3px at calc(100% - 4px) calc(100% - 4px), #67718f 30%, #11152b 75%, transparent 76%);
}

.og-panel-title {
  display:flex; align-items:center; gap:8px;
  padding:9px 14px 8px;
  font-size:10.5px; font-weight:700; letter-spacing:2.4px;
  color:var(--cyan);
  text-shadow:0 0 8px rgba(0,212,255,.7);
  border-bottom:1px solid #1d2a60;
  background:linear-gradient(180deg, rgba(0,212,255,.07), transparent);
  border-radius:10px 10px 0 0;
  text-transform:uppercase;
}
.og-panel-title .tag {
  margin-left:auto; font-size:9px; letter-spacing:1.5px;
  color:var(--steel); text-shadow:none;
}
.og-panel-title .lamp {
  width:7px; height:7px; border-radius:50%;
  background:radial-gradient(circle at 35% 30%, #aef, var(--cyan) 55%, #013);
  box-shadow:0 0 7px var(--cyan), inset 0 -1px 2px rgba(0,0,0,.7);
}
.og-panel-title .lamp.red    { background:radial-gradient(circle at 35% 30%, #ffd, var(--red) 55%, #300); box-shadow:0 0 8px var(--red); }
.og-panel-title .lamp.green  { background:radial-gradient(circle at 35% 30%, #efe, var(--green) 55%, #030); box-shadow:0 0 7px var(--green); }
.og-panel-title .lamp.saffron{ background:radial-gradient(circle at 35% 30%, #ffe, var(--saffron) 55%, #420); box-shadow:0 0 8px var(--saffron); }

.og-panel-body { padding:10px 12px; }

/* ════════════════════════════════════════════════════════════
   MECHANICAL BUTTONS — metallic shader, pressed depth
   ════════════════════════════════════════════════════════════ */
.og-btn {
  position:relative; cursor:pointer; user-select:none;
  font-family:var(--mono); font-size:10.5px; font-weight:700;
  letter-spacing:1.6px; text-transform:uppercase;
  color:var(--pearl);
  padding:9px 14px; border-radius:7px;
  border:1px solid #3a4a8a;
  background:
    linear-gradient(180deg, #2b3a78 0%, #16204e 45%, #0d1334 55%, #131c46 100%);
  box-shadow:
    inset 0 1px 0 rgba(190,210,255,.35),
    inset 0 -3px 5px rgba(0,0,0,.6),
    0 3px 0 #05081a,
    0 5px 10px rgba(0,0,0,.55),
    0 0 12px rgba(0,212,255,.08);
  text-shadow:0 1px 2px rgba(0,0,0,.9);
  transition:transform .07s, box-shadow .07s, filter .15s;
}
.og-btn:hover { filter:brightness(1.25); box-shadow:
    inset 0 1px 0 rgba(190,210,255,.4),
    inset 0 -3px 5px rgba(0,0,0,.6),
    0 3px 0 #05081a, 0 6px 14px rgba(0,0,0,.6),
    0 0 18px rgba(0,212,255,.35);
  transform:translateY(-1px); }
.og-btn:active { transform:translateY(2px); box-shadow:
    inset 0 2px 8px rgba(0,0,0,.8), 0 1px 0 #05081a; }
.og-btn:disabled { opacity:.4; cursor:not-allowed; }

.og-btn.saffron {
  border-color:#b56a1f;
  background:linear-gradient(180deg, #ffae4d 0%, #e07a16 45%, #9c4d05 55%, #c2660d 100%);
  color:#1a0d00; text-shadow:0 1px 1px rgba(255,255,255,.35);
  box-shadow: inset 0 1px 0 rgba(255,235,200,.6), inset 0 -3px 5px rgba(80,30,0,.55),
    0 3px 0 #3a1c00, 0 5px 12px rgba(0,0,0,.55), 0 0 16px rgba(255,153,51,.3);
}
.og-btn.saffron:hover { box-shadow: inset 0 1px 0 rgba(255,235,200,.6),
  inset 0 -3px 5px rgba(80,30,0,.55), 0 3px 0 #3a1c00,
  0 6px 14px rgba(0,0,0,.6), 0 0 26px rgba(255,153,51,.6); }

.og-btn.red {
  border-color:#8a1f1f;
  background:linear-gradient(180deg, #d84040 0%, #8f1515 45%, #5c0606 55%, #7d1010 100%);
  box-shadow: inset 0 1px 0 rgba(255,200,200,.45), inset 0 -3px 5px rgba(40,0,0,.6),
    0 3px 0 #200, 0 5px 12px rgba(0,0,0,.55), 0 0 16px rgba(255,34,34,.3);
}
.og-btn.green {
  border-color:#1c7a3a;
  background:linear-gradient(180deg, #2fcf68 0%, #128a3c 45%, #064d20 55%, #0d6e2f 100%);
  color:#02180a; text-shadow:0 1px 1px rgba(200,255,220,.4);
  box-shadow: inset 0 1px 0 rgba(210,255,225,.55), inset 0 -3px 5px rgba(0,40,10,.6),
    0 3px 0 #021, 0 5px 12px rgba(0,0,0,.55), 0 0 14px rgba(31,184,79,.3);
}
.og-btn.indigo {
  border-color:#5a2a9a;
  background:linear-gradient(180deg, #9a4ae0 0%, #5d1da0 45%, #350a64 55%, #4b1486 100%);
  box-shadow: inset 0 1px 0 rgba(230,200,255,.45), inset 0 -3px 5px rgba(20,0,40,.6),
    0 3px 0 #102, 0 5px 12px rgba(0,0,0,.55), 0 0 16px rgba(106,13,173,.4);
}
.og-btn.mini { padding:5px 9px; font-size:9px; border-radius:5px; }

/* ════════════════════════════════════════════════════════════
   LED READOUTS · STATUS LAMPS · GAUGES
   ════════════════════════════════════════════════════════════ */
.led-readout {
  display:inline-block; padding:4px 10px; border-radius:5px;
  background:linear-gradient(180deg,#02040c,#060b1d);
  border:1px solid #1c2a5e;
  box-shadow:inset 0 2px 6px rgba(0,0,0,.85), inset 0 -1px 0 rgba(120,160,255,.1), 0 1px 0 rgba(160,190,255,.12);
  color:var(--cyan); text-shadow:0 0 7px rgba(0,212,255,.85);
  font-weight:700; letter-spacing:1px;
}
.led-readout.saffron { color:var(--saffron); text-shadow:0 0 8px rgba(255,153,51,.85); }
.led-readout.red     { color:var(--red);     text-shadow:0 0 8px rgba(255,34,34,.9); }
.led-readout.green   { color:var(--green);   text-shadow:0 0 7px rgba(31,184,79,.85); }

.og-gauge { height:9px; border-radius:5px; overflow:hidden;
  background:linear-gradient(180deg,#02040a,#0a0f24);
  border:1px solid #1a2754; box-shadow:inset 0 2px 4px rgba(0,0,0,.85); }
.og-gauge > i { display:block; height:100%; border-radius:4px;
  background:linear-gradient(90deg,var(--green),var(--amber) 60%,var(--red));
  box-shadow:0 0 8px rgba(255,153,51,.5), inset 0 1px 0 rgba(255,255,255,.35);
  transition:width .6s cubic-bezier(.2,.9,.3,1); }
.og-gauge.cyan > i { background:linear-gradient(90deg,#0077aa,var(--cyan));
  box-shadow:0 0 8px rgba(0,212,255,.6), inset 0 1px 0 rgba(255,255,255,.35); }

/* ════════════════════════════════════════════════════════════
   ANIMATIONS
   ════════════════════════════════════════════════════════════ */
@keyframes ogPulseRed {
  0%,100% { box-shadow: inset 0 1px 0 rgba(255,180,180,.2), inset 0 -2px 6px rgba(0,0,0,.65),
            0 0 0 1px rgba(120,0,0,.9), 0 0 14px rgba(255,34,34,.35); border-color:#7a1c1c; }
  50%     { box-shadow: inset 0 1px 0 rgba(255,180,180,.3), inset 0 -2px 6px rgba(0,0,0,.65),
            0 0 0 1px rgba(255,34,34,.8), 0 0 36px rgba(255,34,34,.75); border-color:#ff4444; }
}
.pulse-critical { animation:ogPulseRed 1.1s ease-in-out infinite; }

@keyframes ogBlink { 0%,55% {opacity:1;} 56%,100% {opacity:.25;} }
.blink { animation:ogBlink 1s steps(1) infinite; }

@keyframes ogFlicker {
  0%,93%,100% { opacity:1; } 94% { opacity:.78; } 95% { opacity:1; } 97% { opacity:.86; }
}
.flicker { animation:ogFlicker 5.5s linear infinite; }

@keyframes ogScan { 0% {transform:translateY(-110%);} 100% {transform:translateY(1500%);} }

@keyframes ogShake {
  0%,100%{transform:translate(0,0);} 20%{transform:translate(-3px,2px);}
  40%{transform:translate(3px,-2px);} 60%{transform:translate(-2px,-2px);} 80%{transform:translate(2px,2px);}
}
.shake { animation:ogShake .4s linear 2; }

@keyframes sweep { 0%{left:-40%;} 100%{left:120%;} }

/* ════════════════════════════════════════════════════════════
   GRID LAYOUT — COMMAND CENTER
   ════════════════════════════════════════════════════════════ */
#command-center {
  display:grid; gap:8px; padding:8px;
  grid-template-columns: 218px minmax(0,1fr) 332px;
  grid-template-rows: 54px minmax(420px, 56vh) auto auto;
  grid-template-areas:
    "topbar topbar topbar"
    "sidebar globe assets"
    "threat threat threat"
    "response response response";
  min-height:100vh;
}
#topbar   { grid-area:topbar; }
#sidebar  { grid-area:sidebar; }
#globe-wrap { grid-area:globe; min-width:0; }
#assets   { grid-area:assets; display:flex; flex-direction:column; min-height:0; }
#threat   { grid-area:threat; }
#response { grid-area:response; }

@media (max-width:1180px) {
  #command-center {
    grid-template-columns: 1fr;
    grid-template-areas: "topbar" "globe" "sidebar" "assets" "threat" "response";
    grid-template-rows: auto;
  }
}

/* ── Mission Top Bar ───────────────────────────────────────── */
#topbar { display:flex; align-items:center; gap:10px; padding:0 14px; overflow:hidden; }
#topbar .brand { display:flex; flex-direction:column; line-height:1.15; margin-right:8px; }
#topbar .brand b { font-size:13.5px; letter-spacing:2.5px; color:var(--saffron);
  text-shadow:0 0 12px rgba(255,153,51,.8); white-space:nowrap; }
#topbar .brand span { font-size:8px; letter-spacing:2.8px; color:var(--steel); white-space:nowrap; }
#topbar .stats { display:flex; gap:8px; margin-left:auto; flex-wrap:wrap; align-items:center; }
#topbar .clockbox { text-align:right; line-height:1.2; }
#topbar .clockbox .utc { font-size:12px; color:var(--cyan); text-shadow:0 0 8px rgba(0,212,255,.7); }
#topbar .clockbox .ist { font-size:9px; color:var(--steel); }

/* ── Sidebar ───────────────────────────────────────────────── */
#sidebar .nav-item {
  display:flex; align-items:center; gap:9px;
  padding:10px 12px; margin:5px 8px; cursor:pointer; border-radius:7px;
  border:1px solid transparent; color:var(--steel);
  font-size:10.5px; font-weight:700; letter-spacing:1.6px;
  transition:all .15s;
}
#sidebar .nav-item:hover { color:var(--pearl); border-color:#27357a; background:rgba(0,212,255,.05); }
#sidebar .nav-item.active {
  color:var(--saffron); border-color:#7a4a16;
  background:linear-gradient(90deg, rgba(255,153,51,.16), rgba(255,153,51,.03));
  box-shadow:inset 0 1px 0 rgba(255,200,140,.18), inset 0 -2px 5px rgba(0,0,0,.5), 0 0 12px rgba(255,153,51,.12);
  text-shadow:0 0 8px rgba(255,153,51,.7);
}
#sidebar .nav-item .ico { width:16px; text-align:center; filter:drop-shadow(0 0 4px rgba(0,212,255,.5)); }
#sidebar .sysblock { margin:12px 10px 10px; padding:10px; border-radius:8px;
  background:rgba(2,5,16,.7); border:1px solid #182456;
  box-shadow:inset 0 2px 8px rgba(0,0,0,.7); font-size:9.5px; color:var(--steel); }
#sidebar .sysblock .row { display:flex; justify-content:space-between; margin:5px 0 3px; letter-spacing:1px; }

/* ── Globe ─────────────────────────────────────────────────── */
#globe-wrap { position:relative; overflow:hidden; border-radius:10px; }
#cesiumContainer { position:absolute; inset:0; }
#cesiumContainer .cesium-viewer-bottom { display:none !important; }
#globe-hud {
  position:absolute; top:10px; left:12px; z-index:5; pointer-events:none;
  font-size:9.5px; letter-spacing:1.6px; color:var(--cyan);
  text-shadow:0 0 6px rgba(0,212,255,.8); line-height:1.7;
}
#globe-controls { position:absolute; bottom:12px; left:12px; z-index:5; display:flex; gap:6px; flex-wrap:wrap; }
#globe-crosshair { position:absolute; inset:0; pointer-events:none; z-index:4;
  background:
    linear-gradient(90deg, transparent calc(50% - .5px), rgba(0,212,255,.12) 50%, transparent calc(50% + .5px)),
    linear-gradient(0deg,  transparent calc(50% - .5px), rgba(0,212,255,.12) 50%, transparent calc(50% + .5px)); }
#globe-fallback { position:absolute; left:50%; top:14px; transform:translateX(-50%);
  display:none; align-items:center; text-align:center; flex-direction:column; gap:8px;
  padding:14px 22px; z-index:6; width:min(540px, 92%);
  border-radius:9px; border:1px solid #2a3a7a; cursor:pointer;
  background:rgba(8,12,30,.92); backdrop-filter:blur(6px);
  box-shadow:0 6px 22px rgba(0,0,0,.7), 0 0 18px rgba(255,153,51,.12);
  transition:opacity .8s; }
#globe-fallback.fade { opacity:0; pointer-events:none; }

/* ── Asset registry ────────────────────────────────────────── */
#asset-list { overflow-y:auto; flex:1; min-height:0; max-height:100%; }
.sat-card {
  margin:6px 8px; padding:8px 10px; border-radius:7px; cursor:pointer;
  background:linear-gradient(160deg, rgba(16,22,52,.9), rgba(6,9,24,.95));
  border:1px solid #1c2858;
  box-shadow:inset 0 1px 0 rgba(150,180,255,.1), inset 0 -2px 4px rgba(0,0,0,.5), 0 2px 6px rgba(0,0,0,.45);
  transition:transform .12s, box-shadow .12s;
}
.sat-card:hover { transform:translateY(-2px);
  box-shadow:inset 0 1px 0 rgba(150,180,255,.15), 0 6px 16px rgba(0,0,0,.6), 0 0 14px rgba(0,212,255,.18); }
.sat-card.selected { border-color:var(--saffron); box-shadow:0 0 14px rgba(255,153,51,.35), inset 0 1px 0 rgba(255,200,140,.2); }
.sat-card .nm { display:flex; align-items:center; gap:7px; font-size:11px; font-weight:700; letter-spacing:.6px; }
.sat-card .meta { display:flex; justify-content:space-between; margin-top:4px; font-size:9px; color:var(--steel); letter-spacing:.8px; }
.flagdot { width:8px; height:8px; border-radius:50%; flex:none;
  box-shadow:inset 0 -1px 2px rgba(0,0,0,.6), 0 0 6px currentColor; }
.flagdot.in { background:radial-gradient(circle at 35% 30%, #ffd9b0, var(--saffron) 60%); color:var(--saffron); }
.flagdot.jp { background:radial-gradient(circle at 35% 30%, #e0c0ff, var(--indigo) 60%); color:var(--indigo); }
.flagdot.xx { background:radial-gradient(circle at 35% 30%, #c0f0ff, var(--cyan) 60%); color:var(--cyan); }

.risk-badge { font-size:8.5px; font-weight:800; letter-spacing:1.4px; padding:2px 7px;
  border-radius:4px; margin-left:auto;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.25), inset 0 -2px 3px rgba(0,0,0,.5), 0 1px 3px rgba(0,0,0,.6); }
.risk-badge.CRITICAL { background:linear-gradient(180deg,#ff5050,#8a0a0a); color:#fff; }
.risk-badge.HIGH     { background:linear-gradient(180deg,#ffb259,#b35a00); color:#1a0d00; }
.risk-badge.MEDIUM   { background:linear-gradient(180deg,#ffe48a,#a98414); color:#221a00; }
.risk-badge.LOW      { background:linear-gradient(180deg,#3fd877,#0d6e2f); color:#02180a; }

/* ── Threat intelligence ───────────────────────────────────── */
.threat-row {
  display:grid; grid-template-columns: 92px 1.4fr 1fr 1fr 1fr 1fr 100px 88px;
  gap:8px; align-items:center;
  margin:6px 0; padding:9px 12px; border-radius:7px; font-size:10.5px;
  background:linear-gradient(160deg, rgba(16,22,52,.85), rgba(6,9,24,.92));
  border:1px solid #1c2858; cursor:pointer;
  box-shadow:inset 0 1px 0 rgba(150,180,255,.08), inset 0 -2px 4px rgba(0,0,0,.5);
}
.threat-row:hover { border-color:var(--cyan); box-shadow:0 0 12px rgba(0,212,255,.2); }
.threat-row.CRITICAL { border-color:#7a1c1c; }
.threat-row .lbl { font-size:8px; color:var(--steel); letter-spacing:1.2px; display:block; }
.threat-head { display:grid; grid-template-columns: 92px 1.4fr 1fr 1fr 1fr 1fr 100px 88px;
  gap:8px; padding:4px 12px; font-size:8.5px; letter-spacing:1.5px; color:var(--steel); }
@media (max-width:1180px){
  .threat-row, .threat-head { grid-template-columns: 80px 1.2fr 1fr 1fr 88px; }
  .threat-row .hide-sm, .threat-head .hide-sm { display:none; }
}

/* ── Response console ──────────────────────────────────────── */
#response .console-grid { display:grid; grid-template-columns: 1.15fr 1fr 1.2fr; gap:10px; }
@media (max-width:1180px){ #response .console-grid { grid-template-columns:1fr; } }
.kv { display:flex; justify-content:space-between; padding:5px 2px; font-size:10.5px;
  border-bottom:1px dashed #1a2554; letter-spacing:.6px; }
.kv b { color:var(--cyan); text-shadow:0 0 5px rgba(0,212,255,.5); }
.kv b.warn { color:var(--saffron); text-shadow:0 0 6px rgba(255,153,51,.6); }
.kv b.crit { color:var(--red); text-shadow:0 0 6px rgba(255,34,34,.7); }
.kv b.ok { color:var(--green); text-shadow:0 0 6px rgba(31,184,79,.6); }

#cmd-log { background:#01030a; border:1px solid #16224e; border-radius:7px;
  box-shadow:inset 0 3px 12px rgba(0,0,0,.9);
  padding:10px 12px; height:172px; overflow-y:auto; font-size:10px; line-height:1.75; position:relative; }
#cmd-log .t { color:#3f4f86; }
#cmd-log .ok { color:var(--green); } #cmd-log .warn { color:var(--saffron); }
#cmd-log .err { color:var(--red); } #cmd-log .info { color:var(--cyan); }

/* ── Analytics ─────────────────────────────────────────────── */
#analytics-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(330px,1fr)); gap:10px; padding:0 8px 8px; }
canvas.chart { width:100%; height:190px; display:block; border-radius:7px;
  background:linear-gradient(180deg,#02040c,#060b1d);
  border:1px solid #16224e; box-shadow:inset 0 3px 10px rgba(0,0,0,.8); }

/* ── Loading screen ────────────────────────────────────────── */
#loading-screen {
  position:fixed; inset:0; z-index:1000; display:flex; align-items:center; justify-content:center;
  background:radial-gradient(ellipse at 50% 40%, #0d1538 0%, var(--void) 70%);
  transition:opacity .9s; }
#loading-screen.done { opacity:0; pointer-events:none; }
#boot-box { width:min(620px, 92vw); }
#boot-emblem { text-align:center; margin-bottom:22px; }
#boot-emblem .ring { display:inline-block; width:88px; height:88px; border-radius:50%;
  border:2px solid var(--saffron); border-top-color:transparent; border-bottom-color:var(--indigo);
  animation:spin 2.4s linear infinite;
  box-shadow:0 0 30px rgba(255,153,51,.35), inset 0 0 25px rgba(106,13,173,.3); position:relative; }
@keyframes spin { to { transform:rotate(360deg); } }
#boot-title { font-size:17px; letter-spacing:5px; color:var(--saffron);
  text-shadow:0 0 18px rgba(255,153,51,.8); margin-top:14px; }
#boot-sub { font-size:9px; letter-spacing:3.4px; color:var(--steel); margin-top:5px; }
#boot-log { margin-top:18px; background:#01030a; border:1px solid #1a2554; border-radius:8px;
  box-shadow:inset 0 4px 16px rgba(0,0,0,.9), 0 0 25px rgba(0,212,255,.08);
  padding:16px 18px; height:190px; overflow:hidden; font-size:11px; line-height:1.95; color:var(--cyan); }
#boot-log .cursor { display:inline-block; width:7px; height:13px; background:var(--cyan);
  vertical-align:-2px; animation:ogBlink .7s steps(1) infinite; box-shadow:0 0 7px var(--cyan); }

/* ── Documentation footer ──────────────────────────────────── */
#documentation { margin:8px; }
#documentation h3 { font-size:11px; letter-spacing:2.2px; color:var(--saffron);
  text-shadow:0 0 8px rgba(255,153,51,.6); margin:16px 0 8px; }
#documentation p, #documentation li { font-size:10.8px; line-height:1.8; color:#b9c2dd; letter-spacing:.3px; }
#documentation ul { margin:4px 0 4px 18px; }
#documentation code { color:var(--cyan); background:#040818; padding:1px 6px; border-radius:4px;
  border:1px solid #16224e; font-size:10px; }
#documentation a { color:var(--cyan); text-decoration:none; border-bottom:1px dotted var(--cyan-dim); }
#documentation a:hover { text-shadow:0 0 8px rgba(0,212,255,.8); }
.doc-cols { display:grid; grid-template-columns:repeat(auto-fit,minmax(290px,1fr)); gap:18px; padding:4px 14px 14px; }
.doc-foot { text-align:center; padding:14px; font-size:9px; letter-spacing:2.5px; color:#525d83;
  border-top:1px solid #131e48; }

/* ── modal ─────────────────────────────────────────────────── */
#og-modal-veil { position:fixed; inset:0; z-index:900; background:rgba(2,4,12,.78);
  backdrop-filter:blur(4px); display:none; align-items:center; justify-content:center; }
#og-modal-veil.open { display:flex; }
#og-modal { width:min(680px,94vw); max-height:84vh; display:flex; flex-direction:column; }
#og-modal pre { flex:1; overflow:auto; background:#01030a; border:1px solid #16224e; border-radius:7px;
  box-shadow:inset 0 3px 14px rgba(0,0,0,.9); margin:10px 12px; padding:14px;
  font-size:10px; line-height:1.65; color:#9fdcff; white-space:pre-wrap; }
#og-modal .btnrow { display:flex; gap:8px; padding:0 12px 12px; justify-content:flex-end; }

.muted { color:var(--steel); }
.hidden { display:none !important; }

/* ════════════════════════════════════════════════════════════
   AUTH GATE — Sovereign Access · glassmorphism login/signup
   Shown before the command terminal boots
   ════════════════════════════════════════════════════════════ */
#auth-gate {
  position:fixed; inset:0; z-index:2000; display:flex;
  background:var(--void);
  transition:opacity 1.1s cubic-bezier(.5,0,.2,1), transform 1.1s cubic-bezier(.5,0,.2,1), filter 1.1s;
}
#auth-gate.exit { opacity:0; transform:scale(1.12); filter:blur(14px); pointer-events:none; }

/* left — astronaut hero */
#auth-hero {
  flex:1.15; position:relative; overflow:hidden; min-width:0;
  background:#161028;
}
#auth-hero img {
  position:absolute; inset:0; width:100%; height:100%;
  object-fit:cover; object-position:center 18%;
  animation:heroDrift 18s ease-in-out infinite alternate;
}
@keyframes heroDrift { 0% { transform:scale(1.02) translateY(0);} 100% { transform:scale(1.1) translateY(-2.2%);} }
#auth-hero::after {  /* atmosphere depth */
  content:""; position:absolute; inset:0;
  background:
    radial-gradient(ellipse at 50% 110%, rgba(0,120,255,.22), transparent 55%),
    linear-gradient(90deg, transparent 70%, rgba(5,7,15,.85) 100%),
    linear-gradient(0deg, rgba(5,7,15,.5), transparent 30%);
}
/* glass card floating over the astronaut */
#hero-glass {
  position:absolute; left:7%; bottom:7%; z-index:3; width:min(330px, 80%);
  padding:18px 20px; border-radius:16px;
  background:linear-gradient(135deg, rgba(255,255,255,.13), rgba(255,255,255,.04));
  border:1px solid rgba(255,255,255,.22);
  border-top-color:rgba(255,255,255,.4);
  backdrop-filter:blur(14px) saturate(1.3);
  -webkit-backdrop-filter:blur(14px) saturate(1.3);
  box-shadow:0 14px 40px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.25);
  color:var(--pearl); animation:glassFloat 6s ease-in-out infinite alternate;
}
@keyframes glassFloat { 0% { transform:translateY(0);} 100% { transform:translateY(-10px);} }
#hero-glass .gtitle { font-size:11px; letter-spacing:2.6px; color:var(--saffron);
  text-shadow:0 0 10px rgba(255,153,51,.7); margin-bottom:8px; }
#hero-glass .grow { display:flex; justify-content:space-between; font-size:9.5px;
  letter-spacing:1.2px; padding:4px 0; color:#dfe6ff;
  border-bottom:1px dashed rgba(255,255,255,.14); }
#hero-glass .grow b { color:var(--cyan); text-shadow:0 0 6px rgba(0,212,255,.6); }

/* right — form panel */
#auth-panel {
  width:min(430px, 92vw); flex:none; display:flex; flex-direction:column;
  justify-content:center; padding:40px 38px; position:relative;
  background:linear-gradient(160deg, rgba(16,22,52,.97), rgba(6,9,24,.99));
  border-left:1px solid #1d2a60;
  box-shadow:-22px 0 60px rgba(0,0,0,.6);
}
#auth-panel .brandmark { font-size:21px; letter-spacing:6px; color:var(--pearl);
  font-weight:800; margin-bottom:4px; }
#auth-panel .brandmark span { color:var(--saffron); text-shadow:0 0 14px rgba(255,153,51,.8); }
#auth-panel .brandsub { font-size:8.5px; letter-spacing:3px; color:var(--steel); margin-bottom:26px; }

.sso-row { display:flex; gap:10px; margin-bottom:20px; }
.sso-btn { flex:1; display:flex; align-items:center; justify-content:center; gap:8px;
  padding:10px; border-radius:8px; cursor:pointer; font-family:var(--mono);
  font-size:10px; letter-spacing:1.4px; color:var(--pearl);
  background:linear-gradient(135deg, rgba(255,255,255,.09), rgba(255,255,255,.02));
  border:1px solid rgba(255,255,255,.16);
  backdrop-filter:blur(8px); transition:all .18s; }
.sso-btn:hover { border-color:var(--cyan); box-shadow:0 0 16px rgba(0,212,255,.25); transform:translateY(-2px); }

.auth-tabs { display:flex; gap:4px; margin-bottom:14px;
  background:rgba(2,4,12,.7); border:1px solid #1a2554; border-radius:9px; padding:4px;
  box-shadow:inset 0 2px 8px rgba(0,0,0,.7); }
.auth-tab { flex:1; text-align:center; padding:9px; border-radius:6px; cursor:pointer;
  font-size:10.5px; font-weight:700; letter-spacing:2px; color:var(--steel); transition:all .2s; }
.auth-tab.active { color:#1a0d00;
  background:linear-gradient(180deg,#ffae4d,#e07a16);
  box-shadow:inset 0 1px 0 rgba(255,235,200,.6), 0 2px 8px rgba(255,153,51,.35); }

.auth-field { margin-bottom:12px; }
.auth-field label { display:block; font-size:8.5px; letter-spacing:2px; color:var(--steel); margin-bottom:5px; }
.auth-field input, .auth-field select {
  width:100%; padding:11px 13px; border-radius:8px; color:var(--pearl);
  font-family:var(--mono); font-size:12px; outline:none;
  background:linear-gradient(135deg, rgba(255,255,255,.07), rgba(255,255,255,.015));
  border:1px solid rgba(255,255,255,.14);
  backdrop-filter:blur(8px);
  box-shadow:inset 0 2px 6px rgba(0,0,0,.45);
  transition:border-color .2s, box-shadow .2s; }
.auth-field input:focus, .auth-field select:focus {
  border-color:var(--saffron); box-shadow:0 0 14px rgba(255,153,51,.3), inset 0 2px 6px rgba(0,0,0,.45); }
.auth-field select option { background:#0c1230; }

#auth-submit { width:100%; margin-top:6px; padding:13px; font-size:12px; }
#auth-msg { min-height:18px; margin-top:10px; font-size:10px; letter-spacing:1.2px; text-align:center; }
#auth-msg.err { color:var(--red); } #auth-msg.ok { color:var(--green); }

.auth-note { margin-top:18px; padding:10px 13px; border-radius:8px; font-size:9.5px;
  line-height:1.7; color:#c8b485; letter-spacing:.4px;
  background:rgba(255,153,51,.07); border:1px solid rgba(255,153,51,.3); }

#access-granted { position:absolute; inset:0; z-index:5; display:none;
  align-items:center; justify-content:center; flex-direction:column; gap:12px;
  background:rgba(3,5,14,.88); backdrop-filter:blur(10px); }
#access-granted.show { display:flex; }
#access-granted .big { font-size:22px; letter-spacing:7px; color:var(--green);
  text-shadow:0 0 24px rgba(31,184,79,.9); animation:ogBlink 0.5s steps(1) 3; }

@media (max-width:880px){
  #auth-gate { flex-direction:column; overflow-y:auto; }
  #auth-hero { min-height:300px; flex:none; height:34vh; }
  #auth-panel { width:100%; }
}

/* alert toast */
#alert-toast { position:fixed; right:18px; top:70px; z-index:1500; width:min(380px, 90vw);
  display:none; padding:0; }
#alert-toast.show { display:block; animation:toastIn .4s cubic-bezier(.2,.9,.3,1); }
@keyframes toastIn { 0% { transform:translateX(120%);} 100% { transform:translateX(0);} }

/* ════════ PROFILE CHIP + MENU ════════ */
#profile-chip { display:flex; align-items:center; gap:7px; cursor:pointer;
  padding:6px 11px; border-radius:8px; border:1px solid #2a3a7a;
  background:linear-gradient(180deg,#1b2658,#0c1230);
  box-shadow:inset 0 1px 0 rgba(160,190,255,.2), 0 2px 6px rgba(0,0,0,.5);
  font-size:9.5px; letter-spacing:1.4px; transition:all .15s; }
#profile-chip:hover { border-color:var(--saffron); box-shadow:0 0 14px rgba(255,153,51,.3); }
#profile-avatar { width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center;
  background:radial-gradient(circle at 35% 30%, #ffd9b0, var(--saffron) 65%); color:#1a0d00; font-size:11px;
  box-shadow:0 0 8px rgba(255,153,51,.5); }
#profile-menu { position:fixed; top:64px; right:14px; z-index:800; width:250px; display:none; padding-bottom:6px; }
#profile-menu.open { display:block; animation:toastIn .25s; }
#profile-menu .pm-head { padding:12px 14px 9px; border-bottom:1px solid #1d2a60; }
#profile-menu .pm-head #pm-callsign { font-size:12px; letter-spacing:2px; color:var(--saffron);
  text-shadow:0 0 8px rgba(255,153,51,.6); }
#profile-menu .pm-head div { font-size:9px; letter-spacing:.8px; margin-top:3px; }
#pm-verified { font-size:8.5px !important; letter-spacing:1.4px !important; }
.pm-item { padding:9px 14px; font-size:10px; letter-spacing:1.4px; cursor:pointer; color:#cfd6ee;
  border-bottom:1px dashed #141f4a; transition:all .12s; }
.pm-item:hover { background:rgba(0,212,255,.07); color:var(--cyan); padding-left:18px; }

/* ════════ LIBRARY (READING VAULT) ════════ */
.lib-tab { padding:8px 13px; border-radius:7px; cursor:pointer; font-size:9.5px; font-weight:700;
  letter-spacing:1.4px; color:var(--steel); border:1px solid #1c2858;
  background:linear-gradient(160deg, rgba(16,22,52,.9), rgba(6,9,24,.95));
  box-shadow:inset 0 1px 0 rgba(150,180,255,.08), 0 2px 5px rgba(0,0,0,.4); transition:all .15s; }
.lib-tab:hover { transform:translateY(-2px); color:var(--pearl); }
.lib-tab.active { color:#1a0d00; background:linear-gradient(180deg,#ffae4d,#e07a16);
  border-color:#b56a1f; box-shadow:0 0 14px rgba(255,153,51,.35), inset 0 1px 0 rgba(255,235,200,.6); }
#lib-shelf { display:grid; grid-template-columns:repeat(auto-fill,minmax(290px,1fr)); gap:8px;
  max-height:430px; overflow-y:auto; padding-right:4px; }
.book-card { display:flex; gap:10px; padding:9px 11px; border-radius:7px; align-items:flex-start;
  background:linear-gradient(160deg, rgba(16,22,52,.88), rgba(6,9,24,.94));
  border:1px solid #1c2858; transition:all .15s;
  box-shadow:inset 0 1px 0 rgba(150,180,255,.07), inset 0 -2px 4px rgba(0,0,0,.5); }
.book-card:hover { transform:translateY(-2px); border-color:var(--cyan);
  box-shadow:0 6px 14px rgba(0,0,0,.55), 0 0 12px rgba(0,212,255,.18); }
.book-spine { width:34px; height:48px; flex:none; border-radius:3px 6px 6px 3px; position:relative;
  box-shadow:inset -4px 0 7px rgba(0,0,0,.55), inset 2px 0 0 rgba(255,255,255,.2), 2px 2px 6px rgba(0,0,0,.6); }
.book-spine::after { content:""; position:absolute; left:4px; top:0; bottom:0; width:2px;
  background:rgba(0,0,0,.35); }
.book-card .bk-t { font-size:10.5px; font-weight:700; letter-spacing:.4px; color:var(--pearl); line-height:1.45; }
.book-card .bk-a { font-size:9px; color:var(--steel); margin-top:2px; letter-spacing:.6px; }
.book-card .bk-n { font-size:8.5px; color:#7c89b4; margin-top:3px; line-height:1.5; font-style:italic; }
.book-card .bk-open { margin-top:5px; display:inline-block; font-size:8.5px; letter-spacing:1.4px;
  color:var(--cyan); cursor:pointer; border-bottom:1px dotted var(--cyan-dim); }
.book-card .bk-open:hover { text-shadow:0 0 8px rgba(0,212,255,.8); }

/* ════════ FAQ ════════ */
.faq-item { margin:7px 0; border:1px solid #1c2858; border-radius:8px; overflow:hidden;
  background:linear-gradient(160deg, rgba(16,22,52,.88), rgba(6,9,24,.94));
  box-shadow:inset 0 1px 0 rgba(150,180,255,.07); }
.faq-q { padding:11px 14px; cursor:pointer; font-size:11px; font-weight:700; letter-spacing:.8px;
  color:#dfe6ff; display:flex; justify-content:space-between; align-items:center; transition:all .15s; }
.faq-q:hover { color:var(--saffron); }
.faq-q .chev { transition:transform .25s; color:var(--cyan); }
.faq-item.open .faq-q .chev { transform:rotate(90deg); }
.faq-a { max-height:0; overflow:hidden; transition:max-height .35s ease; }
.faq-item.open .faq-a { max-height:420px; }
.faq-a-inner { padding:2px 14px 13px; font-size:10.5px; line-height:1.85; color:#aeb8d8; }
.faq-a-inner b { color:var(--cyan); } .faq-a-inner i { color:var(--saffron); font-style:normal; }

/* ════════ MEGA FOOTER — THE GUARDIAN WALL ════════ */
#mega-footer { position:relative; margin-top:6px; overflow:hidden;
  background:
    radial-gradient(ellipse 45% 55% at 78% 80%, rgba(120,30,90,.35), transparent 60%),
    radial-gradient(ellipse 38% 50% at 60% 95%, rgba(20,60,160,.3), transparent 60%),
    radial-gradient(ellipse 30% 40% at 88% 60%, rgba(255,80,40,.14), transparent 65%),
    #050308;
  border-top:1px solid #1d2a60; padding:54px 6vw 18px; }
.mf-top { display:flex; gap:40px; flex-wrap:wrap; justify-content:space-between; align-items:flex-end; }
.mf-kicker { font-size:10px; letter-spacing:3px; color:var(--cyan); text-shadow:0 0 8px rgba(0,212,255,.6); margin-bottom:14px; }
.mf-cta h2 { font-family:var(--mono); font-weight:600; font-size:clamp(19px,3.2vw,32px); line-height:1.35;
  color:#e8ecf8; max-width:620px; letter-spacing:.5px; }
.mf-cta h2 span { color:#69719a; }
.mf-contact { margin-top:26px; font-size:11px; line-height:2; }
.mf-contact a { color:var(--pearl); text-decoration:none; font-size:14px; letter-spacing:.5px;
  border-bottom:1px solid transparent; transition:all .2s; }
.mf-contact a:hover { color:var(--saffron); border-color:var(--saffron); text-shadow:0 0 10px rgba(255,153,51,.6); }
.mf-nav { display:flex; gap:26px; flex-wrap:wrap; padding-bottom:6px; }
.mf-nav a { color:#cfd6ee; font-size:12.5px; letter-spacing:.6px; cursor:pointer; text-decoration:none;
  transition:all .2s; }
.mf-nav a:hover { color:var(--cyan); text-shadow:0 0 10px rgba(0,212,255,.7); }
.mf-telemetry { display:flex; gap:22px; flex-wrap:wrap; margin:34px 0 6px; padding:10px 14px;
  border:1px solid rgba(0,212,255,.18); border-radius:9px; font-size:9.5px; letter-spacing:1.6px;
  color:#7fa8c9; background:rgba(0,20,40,.3); backdrop-filter:blur(4px);
  box-shadow:inset 0 1px 0 rgba(0,212,255,.1); }
.mf-telemetry span:first-child { color:var(--green); text-shadow:0 0 6px rgba(31,184,79,.7); }
.mf-wordmark { margin:8px -2vw 0; }
.mf-text { font-family:var(--mono); font-size:118px; font-weight:800; letter-spacing:6px;
  fill:url(#mfg); filter:drop-shadow(0 4px 22px rgba(255,153,51,.25)); }
.mf-bottom { display:flex; justify-content:space-between; gap:14px; flex-wrap:wrap; margin-top:14px;
  padding-top:14px; border-top:1px solid rgba(255,255,255,.07); font-size:9px; letter-spacing:1px; color:#525d83; }
.mf-soc a { color:#8a93b0; margin-left:16px; text-decoration:none; letter-spacing:1.6px; transition:all .2s; }
.mf-soc a:hover { color:var(--saffron); text-shadow:0 0 8px rgba(255,153,51,.6); }

/* ════════ USER GUIDE OVERLAY ════════ */
#guide-veil { position:fixed; inset:0; z-index:950; display:none; align-items:center; justify-content:center;
  background:rgba(2,4,12,.72); backdrop-filter:blur(5px); }
#guide-veil.open { display:flex; }
#guide-card { width:min(560px, 93vw); }
#guide-dots span { display:inline-block; width:7px; height:7px; border-radius:50%; margin:0 3px;
  background:#1c2858; box-shadow:inset 0 1px 2px rgba(0,0,0,.6); }
#guide-dots span.on { background:radial-gradient(circle at 35% 30%, #ffd9b0, var(--saffron) 65%);
  box-shadow:0 0 7px rgba(255,153,51,.7); }
