/* ============================================================
   ORBITAL GUARDIAN AI — ENHANCED GLOBE ENGINE
   Cesium ion globe:
     · real day/night terminator (sun-driven lighting)
     · Earth-at-Night city lights blended on the dark side
     · the Sun rendered in space + star-field skybox
     · CLEAN globe — no wrapper spheres / shell meshes
     · per-satellite SGP4 orbits (inertial sampled positions)
     · glowing orbit paths (saffron = IN, indigo = JP)
     · 3D satellite bus model on the tracked spacecraft
     · debris particle cloud + collision cones at TCA
   Fallback: tactical 2-D flat map when Cesium CDN is offline.
   ============================================================ */
(function () {
  "use strict";
  const C = window.OG_CONFIG;
  const G = {};
  window.OGGlobe = G;

  let viewer = null, flat = null, nightLayerRef = null;
  let satEntities = new Map();      // norad -> entity
  let debrisPoints = null, debrisObjs = [];
  let debrisCursor = 0;
  let eventEntities = [];
  let layers = { IN: true, JP: true, DEBRIS: true };
  let trackedNorad = null;

  /* ───────────────────────── CESIUM PATH ─────────────────── */
  function colorFor(sat) {
    if (sat.country === "IN") return Cesium.Color.fromCssColorString(C.COLORS.ISRO_SAFFRON);
    if (sat.country === "JP") return Cesium.Color.fromCssColorString("#9b59ff");
    return Cesium.Color.fromCssColorString(C.COLORS.CYBER_CYAN).withAlpha(0.85);
  }

  function buildSampledPosition(sat, startDate, hours) {
    const prop = new Cesium.SampledPositionProperty(Cesium.ReferenceFrame.INERTIAL);
    prop.setInterpolationOptions({
      interpolationDegree: 5,
      interpolationAlgorithm: Cesium.LagrangePolynomialApproximation
    });
    const periodS = sat.periodMin * 60;
    const span = Math.max(periodS * 2.2, hours * 3600);
    const step = Math.max(20, periodS / 160);
    for (let t = -periodS * 0.55; t <= span; t += step) {
      const d = new Date(startDate.getTime() + t * 1000);
      const pv = OGPhysics.eciAt(sat, d);
      if (!pv) continue;
      prop.addSample(
        Cesium.JulianDate.fromDate(d),
        new Cesium.Cartesian3(pv.position.x * 1000, pv.position.y * 1000, pv.position.z * 1000)
      );
    }
    sat._sampledUntil = startDate.getTime() + span * 1000;
    return prop;
  }

  /* — imagery chain: never let a failed token produce a black globe —
     1. Esri World Imagery  (tokenless, CORS *) → guaranteed base layer
     2. Cesium ion World Imagery — only attached if a 5 s preflight passes
     3. NASA GIBS VIIRS Black Marble (tokenless) → night-side city lights */
  async function preflightIon(timeoutMs = 5000) {
    try {
      const ctl = new AbortController();
      const tm = setTimeout(() => ctl.abort(), timeoutMs);
      const r = await fetch(
        "https://api.cesium.com/v1/assets/" + C.IMAGERY.ION_ASSET + "/endpoint",
        { headers: { Authorization: "Bearer " + C.CESIUM_ION_TOKEN }, signal: ctl.signal });
      clearTimeout(tm);
      return r.ok;
    } catch (e) { return false; }
  }

  async function initCesium(assets, debris, log) {
    Cesium.Ion.defaultAccessToken = C.CESIUM_ION_TOKEN;

    viewer = new Cesium.Viewer("cesiumContainer", {
      animation: false, timeline: false, geocoder: false, homeButton: false,
      baseLayerPicker: false, navigationHelpButton: false, sceneModePicker: false,
      fullscreenButton: false, infoBox: false, selectionIndicator: false,
      requestRenderMode: false,
      shadows: false,
      baseLayer: false,                          // we attach imagery ourselves below
      terrainProvider: new Cesium.EllipsoidTerrainProvider()  // no ion terrain dependency
    });
    const scene = viewer.scene;

    /* — layer 0: Cesium's BUILT-IN Natural Earth II texture —
       ships on the same CDN as Cesium.js itself → if the engine loaded,
       this Earth texture is guaranteed. The globe can never be blank. — */
    try {
      const ne2 = await Cesium.TileMapServiceImageryProvider.fromUrl(
        Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII"));
      viewer.imageryLayers.addImageryProvider(ne2);
      log("GUARANTEED EARTH TEXTURE ONLINE — Natural Earth II (bundled with engine)", "ok");
    } catch (e) { log("Bundled NE2 texture failed: " + e.message, "warn"); }

    /* — layer 1: tokenless hi-res base imagery (Esri World Imagery) — */
    let esriErrors = 0;
    const esriProvider = new Cesium.UrlTemplateImageryProvider({
      url: C.IMAGERY.ESRI_URL,
      maximumLevel: C.IMAGERY.ESRI_MAX_LEVEL,
      credit: "Esri World Imagery"
    });
    esriProvider.errorEvent.addEventListener(() => {
      if (++esriErrors === 8) {                 // stream failing → drop to NE2 underneath
        esri.show = false;
        log("ESRI TILE STREAM FAILING (network blocked?) — showing bundled Earth texture instead", "warn");
      }
    });
    const esri = viewer.imageryLayers.addImageryProvider(esriProvider);
    log("HI-RES IMAGERY ATTACHED — Esri World Imagery (tokenless stream)", "ok");

    /* — layer 2: Cesium ion world imagery, only after preflight passes — */
    preflightIon().then(async ok => {
      if (!ok) { log("CESIUM ION PREFLIGHT FAILED — staying on Esri base layer (globe unaffected)", "warn"); return; }
      try {
        const ionProvider = await Cesium.IonImageryProvider.fromAssetId(C.IMAGERY.ION_ASSET);
        const ionLayer = viewer.imageryLayers.addImageryProvider(ionProvider);
        viewer.imageryLayers.raiseToTop(ionLayer);
        esri.show = false;                       // ion confirmed — promote it
        log("CESIUM ION WORLD IMAGERY ATTACHED (asset " + C.IMAGERY.ION_ASSET + ", token authenticated)", "ok");
        if (nightLayerRef) viewer.imageryLayers.raiseToTop(nightLayerRef);
      } catch (e) {
        log("ION IMAGERY ATTACH FAILED (" + e.message + ") — Esri base layer remains active", "warn");
      }
    });

    /* — clean space environment: sun, moon, stars; NO shell meshes — */
    scene.sun.show = true;                       // the Sun, physically positioned
    scene.sun.glowFactor = 1.6;
    // the Moon — real ephemeris position, full lunar texture, sun-lit phase
    scene.moon = new Cesium.Moon({
      ellipsoid: Cesium.Ellipsoid.MOON,
      onlySunLighting: true                      // correct lunar phase shading
    });
    scene.moon.show = true;
    scene.skyBox.show = true;                    // Tycho-2 star catalog skybox
    scene.backgroundColor = Cesium.Color.fromCssColorString("#05070f");

    /* — globe lighting —
       BOOT DEFAULT = FULL DAYLIGHT (lighting OFF) so the Earth is always
       fully visible immediately, even when it is 2 AM over India.
       Pressing 🌗 TERMINATOR enables the real sun-driven day/night line. */
    scene.globe.enableLighting = false;
    scene.globe.dynamicAtmosphereLighting = true;
    scene.globe.dynamicAtmosphereLightingFromSun = true;
    scene.globe.atmosphereLightIntensity = 20.0;  // brighter sunlit hemisphere
    scene.globe.nightFadeOutDistance = 4.0e7;
    scene.globe.nightFadeInDistance = 1.0e7;
    scene.globe.showGroundAtmosphere = true;     // thin physical haze on the limb only
    scene.skyAtmosphere.show = true;             // rendered by the globe shader — not an extra sphere
    scene.skyAtmosphere.brightnessShift = 0.15;
    scene.globe.depthTestAgainstTerrain = false;
    scene.highDynamicRange = true;
    // night side must never be pure black — deep navy base under the imagery
    scene.globe.baseColor = Cesium.Color.fromCssColorString("#0d1530");

    /* — Earth-at-Night city lights (NASA GIBS VIIRS Black Marble, tokenless) —
       dayAlpha 0 / nightAlpha 1 → lights appear only on the dark side */
    try {
      nightLayerRef = viewer.imageryLayers.addImageryProvider(
        new Cesium.UrlTemplateImageryProvider({
          url: C.IMAGERY.GIBS_NIGHT_URL,
          maximumLevel: C.IMAGERY.GIBS_MAX_LEVEL,
          credit: "NASA GIBS / VIIRS Black Marble"
        }));
      nightLayerRef.dayAlpha = 0.0;
      nightLayerRef.nightAlpha = 1.0;
      nightLayerRef.brightness = 2.6;            // strong city-light glow on the dark side
      nightLayerRef.gamma = 0.7;                 // lift dim suburban lights into visibility
      nightLayerRef.contrast = 1.15;
      nightLayerRef.show = false;                // hidden until terminator mode is switched on
      log("NIGHT-LIGHTS LAYER ATTACHED — NASA VIIRS Black Marble (sun-gated, night side only)", "ok");
    } catch (e) { log("Night lights layer unavailable: " + e.message, "warn"); }

    /* — clock: live time, accelerated — */
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date());
    viewer.clock.multiplier = 60;
    viewer.clock.shouldAnimate = true;

    /* — satellites — */
    const start = new Date();
    for (const sat of assets) {
      if (!sat.satrec) continue;
      const col = colorFor(sat);
      const pos = buildSampledPosition(sat, start, 6);
      const ent = viewer.entities.add({
        id: "SAT-" + sat.norad,
        name: sat.name,
        position: pos,
        point: {
          pixelSize: sat.country === "XX" ? 5 : 7,
          color: col,
          outlineColor: Cesium.Color.BLACK.withAlpha(0.8),
          outlineWidth: 1
        },
        label: {
          text: sat.name,
          font: "10px JetBrains Mono, monospace",
          fillColor: col,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(10, -10),
          show: false,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        path: {
          show: sat.country !== "XX",
          width: sat.country === "XX" ? 1 : 1.6,
          leadTime: sat.periodMin * 60,
          trailTime: 0,
          resolution: Math.max(30, sat.periodMin * 60 / 180),
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.18,
            taperPower: 0.6,
            color: col.withAlpha(sat.country === "IN" ? 0.55 : sat.country === "JP" ? 0.55 : 0.25)
          })
        }
      });
      ent._sat = sat;
      satEntities.set(sat.norad, ent);
    }
    log(assets.length + " ASSET ORBITS PROPAGATED (SGP4 → inertial sampled paths)", "ok");

    /* — debris particle cloud (point primitives, rolling SGP4 refresh) — */
    debrisPoints = scene.primitives.add(new Cesium.PointPrimitiveCollection());
    debrisObjs = debris.filter(d => d.satrec);
    const dCol = {
      CN: Cesium.Color.fromCssColorString("#ff5544").withAlpha(0.65),
      RU: Cesium.Color.fromCssColorString("#bfa8ff").withAlpha(0.55),
      US: Cesium.Color.fromCssColorString("#9fd8ff").withAlpha(0.55),
      JP: Cesium.Color.fromCssColorString("#c084ff").withAlpha(0.6),
      XX: Cesium.Color.fromCssColorString(C.COLORS.CYBER_CYAN).withAlpha(0.4)
    };
    for (const d of debrisObjs) {
      d._pt = debrisPoints.add({
        position: Cesium.Cartesian3.ZERO,
        pixelSize: 1.6,
        color: dCol[d.origin] || dCol.XX
      });
    }
    log(debrisObjs.length + " TRACKED DEBRIS OBJECTS STREAMING (Fengyun-1C / Cosmos-2251 / Iridium-33)", "ok");

    /* per-tick: rolling debris propagation + resampling of orbits */
    let tick = 0;
    viewer.clock.onTick.addEventListener(clk => {
      tick++;
      const now = Cesium.JulianDate.toDate(clk.currentTime);
      const gmst = satellite.gstime(now);
      const stride = Math.ceil(debrisObjs.length / 6);          // refresh ⅙ per frame
      for (let i = 0; i < stride; i++) {
        const d = debrisObjs[(debrisCursor + i) % debrisObjs.length];
        const pv = OGPhysics.eciAt(d, now);
        if (!pv) continue;
        const ecf = satellite.eciToEcf(pv.position, gmst);
        d._pt.position = new Cesium.Cartesian3(ecf.x * 1000, ecf.y * 1000, ecf.z * 1000);
        d._pt.show = layers.DEBRIS;
      }
      debrisCursor = (debrisCursor + stride) % debrisObjs.length;

      if (tick % 240 === 0) {                                   // extend orbit samples ahead of clock
        for (const ent of satEntities.values()) {
          const s = ent._sat;
          if (now.getTime() > s._sampledUntil - s.periodMin * 30 * 1000) {
            ent.position = buildSampledPosition(s, now, 6);
          }
        }
      }
    });

    /* — picking — */
    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    handler.setInputAction(mv => {
      const picked = scene.pick(mv.position);
      if (picked && picked.id && picked.id._sat) {
        G.focusSat(picked.id._sat.norad);
        if (G.onPick) G.onPick(picked.id._sat);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // snap the camera straight onto Earth/India — no slow fly-in from deep space
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(78.0, 12.0, 2.6e7),
      orientation: { heading: 0, pitch: -Cesium.Math.PI_OVER_TWO, roll: 0 }
    });
    return true;
  }

  /* ── public API ──────────────────────────────────────────── */
  function waitForCesium(maxMs = 8000) {
    return new Promise(resolve => {
      if (window.Cesium) return resolve(true);
      const t0 = Date.now();
      const iv = setInterval(() => {
        if (window.Cesium) { clearInterval(iv); resolve(true); }
        else if (Date.now() - t0 > maxMs) { clearInterval(iv); resolve(false); }
      }, 150);
    });
  }

  G.init = async function (assets, debris, log) {
    const haveCesium = await waitForCesium(12000);  // covers slow / fallback-CDN script loads
    if (haveCesium) {
      log("CESIUM ENGINE LOADED FROM: " + (window.CESIUM_BASE_URL || "local"), "ok");
      try { return await initCesium(assets, debris, log); }
      catch (e) { log("CESIUM INIT FAILED: " + e.message + " — engaging flat tactical map", "err"); }
    } else {
      log("ALL 3 CESIUM CDNs UNREACHABLE (" + (window.OG_CDN_TRIED || []).length +
          " tried: jsDelivr, unpkg, cesium.com) — your network is blocking CDN scripts. " +
          "Engaging 2-D tactical fallback map.", "warn");
    }
    flat = new FlatMap(assets, debris);
    const note = document.getElementById("globe-fallback");
    note.style.display = "flex";
    note.onclick = () => note.classList.add("fade");
    setTimeout(() => note.classList.add("fade"), 14000);   // auto-dismiss, map keeps running
    return false;
  };

  G.focusIndia = function () {
    if (!viewer) return;
    viewer.trackedEntity = undefined; trackedNorad = null;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(78.0, 12.0, 2.6e7),
      orientation: { heading: 0, pitch: -Cesium.Math.PI_OVER_TWO, roll: 0 },
      duration: 2.2
    });
  };

  G.focusSat = function (norad) {
    const ent = satEntities.get(norad);
    if (!viewer || !ent) { if (flat) flat.select(norad); return; }
    // restore previous tracked entity to a point
    if (trackedNorad && trackedNorad !== norad) {
      const prev = satEntities.get(trackedNorad);
      if (prev) { prev.model = undefined; prev.point.show = true; prev.label.show = false; }
    }
    trackedNorad = norad;
    // swap point → full 3-D satellite bus model on the tracked craft
    ent.model = new Cesium.ModelGraphics({
      uri: window.SAT_MODEL_URI,
      minimumPixelSize: 72,
      maximumScale: 240000,
      silhouetteColor: colorFor(ent._sat).withAlpha(0.9),
      silhouetteSize: 1.2
    });
    ent.point.show = false;
    ent.label.show = true;
    ent.path.show = true;
    viewer.trackedEntity = ent;
  };

  G.releaseFocus = function () {
    if (!viewer) return;
    if (trackedNorad) {
      const prev = satEntities.get(trackedNorad);
      if (prev) { prev.model = undefined; prev.point.show = true; prev.label.show = false; }
      trackedNorad = null;
    }
    viewer.trackedEntity = undefined;
  };

  G.setSpeed = function (x) {
    if (viewer) viewer.clock.multiplier = x;
    if (flat) flat.speed = x;
  };

  /* ════════ SKY BODIES — REAL PLANETARY EPHEMERIS ════════
     Low-precision Keplerian ephemeris (JPL/Standish mean elements,
     valid 1800–2050, ~arc-minute class). Heliocentric positions of
     each planet and Earth → geocentric direction → rendered as a
     glowing marker at a compressed display distance with the TRUE
     sky direction. The Moon is rendered natively by Cesium.       */
  const PLANETS = [
    // a(AU), e, I(deg), L(deg), ϖ(deg), Ω(deg) + century rates — JPL approx. elements
    { n:"MERCURY", c:"#bfb8ae", el:[0.38709927,0.20563593,7.00497902,252.25032350,77.45779628,48.33076593],
      r:[0.00000037,0.00001906,-0.00594749,149472.67411175,0.16047689,-0.12534081] },
    { n:"VENUS",   c:"#ffe9c4", el:[0.72333566,0.00677672,3.39467605,181.97909950,131.60246718,76.67984255],
      r:[0.00000390,-0.00004107,-0.00078890,58517.81538729,0.00268329,-0.27769418] },
    { n:"MARS",    c:"#ff7a59", el:[1.52371034,0.09339410,1.84969142,-4.55343205,-23.94362959,49.55953891],
      r:[0.00001847,0.00007882,-0.00813131,19140.30268499,0.44441088,-0.29257343] },
    { n:"JUPITER", c:"#ffd9a0", el:[5.20288700,0.04838624,1.30439695,34.39644051,14.72847983,100.47390909],
      r:[-0.00011607,-0.00013253,-0.00183714,3034.74612775,0.21252668,0.20469106] },
    { n:"SATURN",  c:"#f2e7b8", el:[9.53667594,0.05386179,2.48599187,49.95424423,92.59887831,113.66242448],
      r:[-0.00125060,-0.00050991,0.00193609,1222.49362201,-0.41897216,-0.28867794] },
  ];
  const EARTH_EL = { el:[1.00000261,0.01671123,-0.00001531,100.46457166,102.93768193,0.0],
                     r:[0.00000562,-0.00004392,-0.01294668,35999.37244981,0.32327364,0.0] };

  function helioPos(body, T) {        // T = Julian centuries since J2000
    const d = body.el, dr = body.r;
    const a = d[0] + dr[0]*T, e = d[1] + dr[1]*T;
    const I = (d[2] + dr[2]*T) * Math.PI/180;
    const L = (d[3] + dr[3]*T) * Math.PI/180;
    const w_= (d[4] + dr[4]*T) * Math.PI/180;   // ϖ
    const O = (d[5] + dr[5]*T) * Math.PI/180;
    const M = L - w_;                            // mean anomaly
    let E = M;                                   // Kepler solve
    for (let i = 0; i < 8; i++) E = M + e * Math.sin(E);
    const xp = a * (Math.cos(E) - e);
    const yp = a * Math.sqrt(1 - e*e) * Math.sin(E);
    const w = w_ - O;                            // argument of perihelion
    const cw=Math.cos(w), sw=Math.sin(w), cO=Math.cos(O), sO=Math.sin(O), cI=Math.cos(I), sI=Math.sin(I);
    return {                                     // heliocentric ecliptic (AU)
      x:(cw*cO - sw*sO*cI)*xp + (-sw*cO - cw*sO*cI)*yp,
      y:(cw*sO + sw*cO*cI)*xp + (-sw*sO + cw*cO*cI)*yp,
      z:(sw*sI)*xp + (cw*sI)*yp
    };
  }

  let planetEntities = [], planetsOn = false;
  G.togglePlanets = function () {
    if (!viewer) return false;
    planetsOn = !planetsOn;
    if (planetsOn && planetEntities.length === 0) buildPlanets();
    for (const e of planetEntities) e.show = planetsOn;
    return planetsOn;
  };

  function planetPositions(date) {
    const jd = date.getTime()/86400000 + 2440587.5;
    const T = (jd - 2451545.0) / 36525.0;
    const earth = helioPos(EARTH_EL, T);
    const eps = 23.43928 * Math.PI/180;          // obliquity → equatorial
    const gm = satellite.gstime(date);
    return PLANETS.map(p => {
      const h = helioPos(p, T);
      // geocentric ecliptic → equatorial (ICRF-ish)
      const gx = h.x-earth.x, gy = h.y-earth.y, gz = h.z-earth.z;
      const qx = gx, qy = gy*Math.cos(eps) - gz*Math.sin(eps), qz = gy*Math.sin(eps) + gz*Math.cos(eps);
      const dAU = Math.hypot(qx,qy,qz);
      // rotate into Earth-fixed by GMST, place at compressed display range
      const c=Math.cos(gm), s=Math.sin(gm);
      const ex =  c*qx + s*qy, ey = -s*qx + c*qy, ez = qz;
      const R = 2.2e8;                            // 220,000 km display shell
      const m = R/Math.hypot(ex,ey,ez);
      return { p, dAU, pos: new Cesium.Cartesian3(ex*m, ey*m, ez*m) };
    });
  }

  function buildPlanets() {
    const now = new Date();
    for (const { p, dAU, pos } of planetPositions(now)) {
      const col = Cesium.Color.fromCssColorString(p.c);
      planetEntities.push(viewer.entities.add({
        position: pos,
        point: { pixelSize: 7, color: col, outlineColor: col.withAlpha(0.25), outlineWidth: 6 },
        label: {
          text: "🪐 " + p.n + "  ·  " + dAU.toFixed(2) + " AU",
          font: "11px JetBrains Mono, monospace",
          fillColor: col, outlineColor: Cesium.Color.BLACK, outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(10, -12),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      }));
    }
    // refresh true directions once a minute
    setInterval(() => {
      if (!planetsOn) return;
      const upd = planetPositions(new Date());
      upd.forEach((u, i) => { if (planetEntities[i]) planetEntities[i].position = u.pos; });
    }, 60000);
  }

  /* — day/night terminator switch —
     ON  = real sun-driven lighting (night side dark + city lights)
     OFF = full-bright daylight imagery on the whole globe (BOOT DEFAULT) */
  let lightingOn = false;
  G.toggleLighting = function () {
    lightingOn = !lightingOn;
    if (viewer) {
      viewer.scene.globe.enableLighting = lightingOn;
      if (nightLayerRef) nightLayerRef.show = lightingOn;
    }
    return lightingOn;
  };

  G.toggleLayer = function (key) {
    layers[key] = !layers[key];
    if (viewer) {
      for (const ent of satEntities.values()) {
        if (ent._sat.country === key) ent.show = layers[key];
      }
    }
    if (flat) flat.layers = layers;
    return layers[key];
  };

  /* — collision-event geometry: encounter corridor + cone — */
  G.showEvents = function (events) {
    if (!viewer) { if (flat) flat.events = events; return; }
    for (const e of eventEntities) viewer.entities.remove(e);
    eventEntities = [];
    const top = events.filter(e => e.band === "CRITICAL" || e.band === "HIGH").slice(0, 6);
    for (const ev of top) {
      const pa = OGPhysics.eciAt(ev.primary, ev.tca);
      const pb = OGPhysics.eciAt(ev.secondary, ev.tca);
      if (!pa || !pb) continue;
      const gmst = satellite.gstime(ev.tca);
      const A = satellite.eciToEcf(pa.position, gmst);
      const B = satellite.eciToEcf(pb.position, gmst);
      const cA = new Cesium.Cartesian3(A.x * 1000, A.y * 1000, A.z * 1000);
      const cB = new Cesium.Cartesian3(B.x * 1000, B.y * 1000, B.z * 1000);
      const red = Cesium.Color.fromCssColorString(C.COLORS.CRITICAL_RED);

      eventEntities.push(viewer.entities.add({          // encounter corridor
        polyline: {
          positions: [cA, cB],
          width: 2.5,
          material: new Cesium.PolylineGlowMaterialProperty({ glowPower: 0.35, color: red.withAlpha(0.9) })
        }
      }));
      // collision cone — apex toward the asset, opening along the approach axis
      try {
        const mid = Cesium.Cartesian3.midpoint(cA, cB, new Cesium.Cartesian3());
        const dir = Cesium.Cartesian3.subtract(cB, cA, new Cesium.Cartesian3());
        Cesium.Cartesian3.normalize(dir, dir);
        const axis = Cesium.Cartesian3.cross(Cesium.Cartesian3.UNIT_Z, dir, new Cesium.Cartesian3());
        let rot;
        if (Cesium.Cartesian3.magnitude(axis) < 1e-8) {
          rot = Cesium.Quaternion.IDENTITY;
        } else {
          Cesium.Cartesian3.normalize(axis, axis);
          rot = Cesium.Quaternion.fromAxisAngle(axis,
            Cesium.Cartesian3.angleBetween(Cesium.Cartesian3.UNIT_Z, dir));
        }
        eventEntities.push(viewer.entities.add({
          position: mid,
          orientation: new Cesium.ConstantProperty(rot),
          cylinder: {
            length: Math.max(ev.missKm * 1000 * 2, 120000),
            topRadius: 0,
            bottomRadius: Math.max(ev.missKm * 1000 * 0.6, 40000),
            material: red.withAlpha(0.12),
            outline: true,
            outlineColor: red.withAlpha(0.55),
            numberOfVerticalLines: 10
          }
        }));
      } catch (e) { /* degenerate geometry — corridor + marker still shown */ }
      eventEntities.push(viewer.entities.add({          // TCA marker
        position: cB,
        point: { pixelSize: 9, color: red, outlineColor: Cesium.Color.WHITE.withAlpha(0.6), outlineWidth: 1 },
        label: {
          text: "⚠ TCA " + ev.tca.toISOString().slice(11, 16) + "Z · " + ev.missKm.toFixed(2) + " km",
          font: "11px JetBrains Mono, monospace",
          fillColor: red, outlineColor: Cesium.Color.BLACK, outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(12, -14),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      }));
    }
  };

  /* ───────────────── 2-D TACTICAL FALLBACK MAP ───────────── */
  function FlatMap(assets, debris) {
    const cv = document.createElement("canvas");
    cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";
    document.getElementById("cesiumContainer").appendChild(cv);
    const ctx = cv.getContext("2d");
    this.assets = assets.filter(a => a.satrec);
    this.debris = debris.filter(d => d.satrec).slice(0, 400);
    this.speed = 60; this.layers = layers; this.events = [];
    this.selected = null;
    let simT = Date.now();
    const self = this;
    this.select = n => { self.selected = n; };

    function lonlat(sat, date) {
      const pv = OGPhysics.eciAt(sat, date);
      if (!pv) return null;
      const gd = satellite.eciToGeodetic(pv.position, satellite.gstime(date));
      return { lon: satellite.degreesLong(gd.longitude), lat: satellite.degreesLat(gd.latitude), alt: gd.height };
    }
    function XY(lon, lat, w, h) { return [ (lon + 180) / 360 * w, (90 - lat) / 180 * h ]; }

    function subsolar(d) {
      const n = (d - new Date(Date.UTC(d.getUTCFullYear(), 0, 0))) / 864e5;
      const decl = -23.44 * Math.cos(2 * Math.PI / 365 * (n + 10));
      const lon = 180 - (d.getUTCHours() + d.getUTCMinutes() / 60) * 15;
      return { lon, lat: decl };
    }

    function frame() {
      const w = cv.width = cv.clientWidth * devicePixelRatio;
      const h = cv.height = cv.clientHeight * devicePixelRatio;
      simT += 16 * self.speed;
      const now = new Date(simT);
      ctx.fillStyle = "#060a18"; ctx.fillRect(0, 0, w, h);

      // night shading
      const ss = subsolar(now);
      const cell = w / 72;
      for (let gx = 0; gx < 72; gx++) for (let gy = 0; gy < 36; gy++) {
        const lon = gx * 5 - 177.5, lat = 87.5 - gy * 5;
        const cosz = Math.sin(lat * Math.PI / 180) * Math.sin(ss.lat * Math.PI / 180) +
          Math.cos(lat * Math.PI / 180) * Math.cos(ss.lat * Math.PI / 180) *
          Math.cos((lon - ss.lon) * Math.PI / 180);
        if (cosz < 0) { ctx.fillStyle = "rgba(0,0,10,0.5)"; ctx.fillRect(gx * cell, gy * (h / 36), cell + 1, h / 36 + 1); }
        else { ctx.fillStyle = `rgba(10,30,70,${0.25 * cosz})`; ctx.fillRect(gx * cell, gy * (h / 36), cell + 1, h / 36 + 1); }
      }
      // graticule
      ctx.strokeStyle = "rgba(0,212,255,0.13)"; ctx.lineWidth = 1;
      for (let lon = -180; lon <= 180; lon += 30) { const [x] = XY(lon, 0, w, h); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let lat = -90; lat <= 90; lat += 30) { const [, y] = XY(0, lat, w, h); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      // India crosshair
      const [ix, iy] = XY(78, 21, w, h);
      ctx.strokeStyle = "rgba(255,153,51,0.6)";
      ctx.strokeRect(ix - 26, iy - 26, 52, 52);
      ctx.fillStyle = "rgba(255,153,51,0.9)"; ctx.font = `${10 * devicePixelRatio}px monospace`;
      ctx.fillText("ISRO AOR", ix - 24, iy - 32);

      // debris
      if (self.layers.DEBRIS) {
        for (const d of self.debris) {
          const p = lonlat(d, now); if (!p) continue;
          const [x, y] = XY(p.lon, p.lat, w, h);
          ctx.fillStyle = d.origin === "CN" ? "rgba(255,85,68,0.5)" : "rgba(0,212,255,0.3)";
          ctx.fillRect(x, y, 2, 2);
        }
      }
      // assets with short ground-track
      for (const s of self.assets) {
        if (s.country === "IN" && !self.layers.IN) continue;
        if (s.country === "JP" && !self.layers.JP) continue;
        const p = lonlat(s, now); if (!p) continue;
        const col = s.country === "IN" ? "#ff9933" : s.country === "JP" ? "#b07aff" : "#00d4ff";
        ctx.strokeStyle = col + "55"; ctx.beginPath();
        let pen = false;
        for (let dt = -30; dt <= 0; dt += 3) {
          const q = lonlat(s, new Date(simT + dt * 60000)); if (!q) continue;
          const [x, y] = XY(q.lon, q.lat, w, h);
          if (!pen) { ctx.moveTo(x, y); pen = true; }
          else if (Math.abs(q.lon - p.lon) < 90) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.stroke();
        const [x, y] = XY(p.lon, p.lat, w, h);
        ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(x, y, s.norad === self.selected ? 5 : 3, 0, 7); ctx.fill();
        ctx.shadowBlur = 0;
        if (s.norad === self.selected || s.cat === "NAVIGATION") {
          ctx.fillStyle = col; ctx.fillText(s.name, x + 7, y - 5);
        }
      }
      ctx.fillStyle = "rgba(0,212,255,0.8)";
      ctx.fillText("TACTICAL FLAT-MAP MODE · " + now.toISOString().slice(0, 19) + "Z · SPEED " + self.speed + "×", 12, h - 12);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
})();
