"""
============================================================
PHASE 2.3 — KESSLER CASCADE ENGINE
============================================================

THE MATH (Kessler & Cour-Palais 1978, kinetic-gas analogy)
---------------------------------------------------------
Treat each altitude shell as a well-mixed gas of N objects with
collision cross-section σ and mean relative speed v̄ inside shell
volume V. The mean collision rate between catalogue members is

    C = N² σ v̄ / (2V)            [collisions / second]
      (×3.15e7 s/yr → per year;  ÷2 avoids double counting pairs)

Shell volume between altitudes h_lo, h_hi:

    V = (4π/3) [ (R⊕+h_hi)³ − (R⊕+h_lo)³ ]

Population recurrence per year (fragments gained − drag losses):

    N_{y+1} = N_y + C_y · k  −  λ · N_y
       k = 120 fragments per catastrophic collision
       λ = 0.012 /yr  (drag removal, altitude-averaged)

Chain-reaction probability score (LEO < 1000 km):

    P_chain = min(0.99, max_shells(C_y · 3))

Seeding: tracked sample × CATALOG_SCALE (the public catalogue is
~1/40 of the statistically modelled >10 cm population) + floor.
"""
from __future__ import annotations
import math
from typing import List

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import KESSLER, R_EARTH
from services.propagator import SpaceObject

SHELLS = [
    ("LEO 400-600",    400.0,   600.0),
    ("LEO 600-800",    600.0,   800.0),
    ("LEO 800-1000",   800.0,  1000.0),
    ("LEO 1000-1400", 1000.0,  1400.0),
    ("MEO",           1400.0, 30000.0),
    ("GEO",          30000.0, 50000.0),
]


def shell_volume_km3(lo: float, hi: float) -> float:
    return (4.0 / 3.0) * math.pi * ((R_EARTH + hi) ** 3 - (R_EARTH + lo) ** 3)


def simulate(debris: List[SpaceObject], years: int = 25) -> dict:
    K = KESSLER
    # seed each shell from the real tracked sample
    pops = []
    for name, lo, hi in SHELLS:
        n_tracked = sum(1 for d in debris
                        if d.perigee_km < hi and d.apogee_km > lo)
        pops.append(n_tracked * K["CATALOG_SCALE"] + K["SEED_FLOOR"])

    grid: list[list[float]] = []
    chain_prob = 0.0
    secs_per_year = 3.15e7

    for _y in range(years + 1):
        row = []
        for i, (name, lo, hi) in enumerate(SHELLS):
            V = shell_volume_km3(lo, hi)
            # collisions per year in this shell
            rate = (pops[i] ** 2) * K["SIGMA_KM2"] * K["V_AVG_KMS"] \
                   * secs_per_year / (2.0 * V)
            pops[i] += rate * K["FRAGMENTS_PER_HIT"] - pops[i] * K["DECAY_PER_YEAR"]
            row.append(round(pops[i], 1))
            if lo < 1000.0:
                chain_prob = max(chain_prob, min(0.99, rate * 3.0))
        grid.append(row)

    return dict(
        shells=[s[0] for s in SHELLS],
        grid=grid,
        years=years,
        chain_reaction_probability=round(chain_prob, 4),
        final_populations={SHELLS[i][0]: round(pops[i]) for i in range(len(SHELLS))},
    )
