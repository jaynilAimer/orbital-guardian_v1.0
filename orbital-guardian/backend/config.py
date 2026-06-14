"""
============================================================
ORBITAL GUARDIAN AI — BACKEND CONFIGURATION
============================================================
"""
from __future__ import annotations
import os

# ── Physics constants ────────────────────────────────────────
R_EARTH = 6371.0  # km
MU_EARTH = 398600.4418  # km³/s²

# ── ML risk model weights ────────────────────────────────────
ML_WEIGHTS = {"PC": 0.46, "DIST": 0.34, "VEL": 0.20}
DIST_DECAY_KM = 8.0
VEL_NORM_KMS = 15.0

# ── Geopolitical risk weights ────────────────────────────────
GEO_WEIGHTS = {
    "CN": {"w": 1.35, "label": "PRC · HIGH RISK ORIGIN (ASAT history)"},
    "RU": {"w": 1.20, "label": "RUSSIA · ELEVATED (debris field origin)"},
    "US": {"w": 1.05, "label": "USA · STANDARD"},
    "IN": {"w": 0.95, "label": "INDIA · OWN ASSET (mitigatable)"},
    "JP": {"w": 0.95, "label": "JAPAN · OWN ASSET (mitigatable)"},
    "XX": {"w": 1.00, "label": "UNKNOWN · BASELINE"},
}

# ── Kessler cascade model ────────────────────────────────────
KESSLER = {
    "CATALOG_SCALE": 40,
    "SEED_FLOOR": 50,
    "SIGMA_KM2": 4e-6,
    "V_AVG_KMS": 10.0,
    "FRAGMENTS_PER_HIT": 120,
    "DECAY_PER_YEAR": 0.012,
}

# ── Spacecraft parameters (generic ISRO bus) ─────────────────
SPACECRAFT = {
    "MASS_KG": 1425,
    "ISP_S": 220,
    "G0": 9.80665e-3,  # km/s²
    "FUEL_BUDGET_KG": 50,
}

# ── Conjunction screening ────────────────────────────────────
SCAN = {
    "SCREEN_KM": 50,
    "WINDOW_HOURS": 12,
    "COARSE_STEP_S": 90,
    "REFINE_HALF_S": 45,
    "REFINE_STEP_S": 1,
    "MAX_EVENTS": 100,
}

# ── Collision probability (Foster) ───────────────────────────
PHYSICS = {
    "HBR_M": 20,
    "SIGMA_RADIAL_M": 600,
    "SIGMA_INTRACK_M": 1500,
}

# ── Alert channels ───────────────────────────────────────────
SMTP_HOST = os.getenv("OG_SMTP_HOST", "")
SMTP_PORT = int(os.getenv("OG_SMTP_PORT", "587"))
SMTP_USER = os.getenv("OG_SMTP_USER", "")
SMTP_PASS = os.getenv("OG_SMTP_PASS", "")
ALERT_FROM = os.getenv("OG_ALERT_FROM", "Orbital Guardian AI <ops@orbitalguardian.space>")
TELEGRAM_TOKEN = os.getenv("OG_TELEGRAM_TOKEN", "")
TELEGRAM_CHAT = os.getenv("OG_TELEGRAM_CHAT", "")
WEBHOOK_URL = os.getenv("OG_WEBHOOK_URL", "")
