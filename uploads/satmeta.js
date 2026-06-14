/* ============================================================
   ORBITAL GUARDIAN AI — SYSTEM CONFIGURATION
   Saffron Cosmos Theme · India–Japan Axis
   ============================================================ */
window.OG_CONFIG = {

  // ---- Cesium ion ----
  CESIUM_ION_TOKEN:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0YTM5NTA0OS03OWNiLTRhNTMtYTdlNy1jNDZjYzUwODgyOTUiLCJpZCI6NDQyMDg5LCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3ODA5OTEyNDB9.t_IzM-o4-wClWT7ms2EQFSGWKyziarRJ5HXVwxDW06Y",
  // ---- Globe imagery chain (each verified reachable + CORS-enabled) ----
  IMAGERY: {
    ION_ASSET: 2,                          // Cesium ion World Imagery (preflight-checked at boot)
    ESRI_URL:  "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ESRI_MAX_LEVEL: 17,
    // NASA GIBS VIIRS Black Marble — tokenless night-lights WMTS
    GIBS_NIGHT_URL: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png",
    GIBS_MAX_LEVEL: 8
  },

  // ---- Live TLE sources (CelesTrak GP API, CORS-enabled) ----
  TLE_SOURCES: {
    NAVIC:    "https://celestrak.org/NORAD/elements/gp.php?NAME=IRNSS&FORMAT=tle",
    CARTOSAT: "https://celestrak.org/NORAD/elements/gp.php?NAME=CARTOSAT&FORMAT=tle",
    RISAT:    "https://celestrak.org/NORAD/elements/gp.php?NAME=RISAT&FORMAT=tle",
    GSAT:     "https://celestrak.org/NORAD/elements/gp.php?NAME=GSAT&FORMAT=tle",
    QZSS:     "https://celestrak.org/NORAD/elements/gp.php?NAME=QZS&FORMAT=tle",
    HIMAWARI: "https://celestrak.org/NORAD/elements/gp.php?NAME=HIMAWARI&FORMAT=tle",
    ALOS:     "https://celestrak.org/NORAD/elements/gp.php?NAME=ALOS&FORMAT=tle",
    FENGYUN_DEB: "https://celestrak.org/NORAD/elements/gp.php?GROUP=fengyun-1c-debris&FORMAT=tle",
    COSMOS_DEB:  "https://celestrak.org/NORAD/elements/gp.php?GROUP=cosmos-2251-debris&FORMAT=tle",
    IRIDIUM_DEB: "https://celestrak.org/NORAD/elements/gp.php?GROUP=iridium-33-debris&FORMAT=tle"
  },

  // ---- Saffron Cosmos palette ----
  COLORS: {
    DEEP_SPACE:  "#0a0e1a",
    ASHOKA_NAVY: "#000080",
    ISRO_SAFFRON:"#ff9933",
    ISRO_DEEP:   "#ff6600",
    JAXA_INDIGO: "#6a0dad",
    JAXA_DEEP:   "#4B0082",
    CYBER_CYAN:  "#00d4ff",
    CRITICAL_RED:"#ff2222",
    SAFE_GREEN:  "#1fb84f",
    PEARL:       "#f5f5f5"
  },

  // ---- Conjunction screening parameters ----
  SCAN: {
    WINDOW_HOURS: 12,          // look-ahead window
    COARSE_STEP_S: 90,         // coarse propagation step
    SCREEN_KM: 50,             // coarse gate — candidate event
    BAND_PAD_KM: 75,           // apogee/perigee band overlap padding
    REFINE_HALF_S: 120,        // refine ± seconds around coarse minimum
    REFINE_STEP_S: 1,
    MAX_EVENTS: 24
  },

  // ---- Foster 2-D probability model assumptions ----
  PHYSICS: {
    HBR_M: 20,                 // combined hard-body radius (m)
    SIGMA_RADIAL_M: 400,       // combined covariance, radial   (1σ, m)
    SIGMA_INTRACK_M: 1500,     // combined covariance, in-track (1σ, m)
    MU_EARTH: 398600.4418      // km³/s²
  },

  // ---- Maneuver / spacecraft assumptions (typical IRS-class bus) ----
  SPACECRAFT: {
    MASS_KG: 1450,
    ISP_S: 220,                // monopropellant hydrazine
    G0: 9.80665,
    FUEL_BUDGET_KG: 84,
    TARGET_MISS_KM: 10
  },

  // ---- Geopolitical risk multipliers (debris origin weighting) ----
  GEO_WEIGHTS: {
    "CN": { w: 1.40, label: "FENGYUN-1C ASAT FIELD",        note: "2007 Chinese ASAT test — largest debris event in history" },
    "RU": { w: 1.20, label: "COSMOS-2251 FRAGMENTS",        note: "2009 Cosmos–Iridium hypervelocity collision" },
    "US": { w: 1.15, label: "IRIDIUM-33 FRAGMENTS",         note: "2009 Cosmos–Iridium hypervelocity collision" },
    "JP": { w: 1.05, label: "ALOS FRAGMENTATION",           note: "Daichi anomaly fragments" },
    "XX": { w: 1.00, label: "UNATTRIBUTED",                 note: "" }
  },

  // ---- Automated authority alert engine ----
  ALERTS: {
    BACKEND_URL: "http://localhost:8000",   // FastAPI alert fan-out (SMTP+Telegram+webhook)
    // Optional no-backend path: create a free EmailJS account, then fill these:
    EMAILJS: {
      SERVICE_ID:  "YOUR_EMAILJS_SERVICE_ID",
      TEMPLATE_ID: "YOUR_EMAILJS_TEMPLATE_ID",
      PUBLIC_KEY:  "YOUR_EMAILJS_PUBLIC_KEY"
    }
  },

  // ---- Risk classification thresholds (miss distance, km) ----
  RISK_BANDS: [
    { id: "CRITICAL", maxKm: 1.0,  color: "#ff2222" },
    { id: "HIGH",     maxKm: 5.0,  color: "#ff9933" },
    { id: "MEDIUM",   maxKm: 25.0, color: "#ffd24d" },
    { id: "LOW",      maxKm: 1e9,  color: "#1fb84f" }
  ]
};
