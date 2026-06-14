"""
============================================================
PHASE 2.1 — ML RISK ENGINE (FEATURE-WEIGHTED SCORING)
============================================================

THE MATH
--------
Three normalised features in [0,1]:

  f_pc   = clip( (log₁₀ Pc + 12) / 12 , 0, 1 )
           → maps Pc ∈ [1e-12, 1] onto [0,1] logarithmically
             (collision probabilities span ~300 decades; the log
              compresses them into a learnable feature)

  f_dist = exp( − d_miss / 8 km )
           → exponential proximity kernel: 0 km → 1.0,
             8 km → 0.37, 24 km → 0.05

  f_vel  = min(1, v_rel / 15 km/s)
           → kinetic-energy proxy; hypervelocity LEO crossings
             approach 14–15 km/s

Weighted sum × geopolitical multiplier w_geo (config):

  score = round( min(0.99, (0.46·f_pc + 0.34·f_dist + 0.20·f_vel) · w_geo) · 100 )

The weights are the "trained model" — in a production system these
become logistic-regression / GBM coefficients fitted on historical
CDM archives; the India / Japan / General split is exposed via the
`model` arg so per-fleet calibration can be plugged in.
"""
from __future__ import annotations
import math

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import ML_WEIGHTS, GEO_WEIGHTS, DIST_DECAY_KM, VEL_NORM_KMS
from services.collision_prob import ConjunctionEvent

# per-fleet calibration multipliers (sovereign prioritisation)
MODEL_CAL = {"INDIA": 1.06, "JAPAN": 1.03, "GENERAL": 1.00}


def features(pc: float, miss_km: float, v_rel_kms: float) -> dict:
    f_pc = min(1.0, max(0.0, (math.log10(max(pc, 1e-12)) + 12.0) / 12.0))
    f_dist = math.exp(-miss_km / DIST_DECAY_KM)
    f_vel = min(1.0, v_rel_kms / VEL_NORM_KMS)
    return dict(f_pc=f_pc, f_dist=f_dist, f_vel=f_vel)


def risk_score(pc: float, miss_km: float, v_rel_kms: float,
               origin: str = "XX", model: str = "GENERAL") -> int:
    f = features(pc, miss_km, v_rel_kms)
    w_geo = GEO_WEIGHTS.get(origin, GEO_WEIGHTS["XX"])["w"]
    cal = MODEL_CAL.get(model, 1.0)
    raw = (ML_WEIGHTS["PC"] * f["f_pc"]
           + ML_WEIGHTS["DIST"] * f["f_dist"]
           + ML_WEIGHTS["VEL"] * f["f_vel"]) * w_geo * cal
    return round(min(0.99, raw) * 100)


def classify(score: int) -> str:
    """Score → LOW / MEDIUM / HIGH / CRITICAL label."""
    return ("CRITICAL" if score >= 75 else
            "HIGH" if score >= 55 else
            "MEDIUM" if score >= 30 else "LOW")


def score_event(ev: ConjunctionEvent) -> ConjunctionEvent:
    model = ("INDIA" if ev.primary.country == "IN"
             else "JAPAN" if ev.primary.country == "JP" else "GENERAL")
    ev.score = risk_score(ev.pc, ev.miss_km, ev.v_rel_kms,
                          origin=ev.secondary.origin, model=model)
    return ev
