"""
============================================================
PHASE 1.1 — PROPAGATOR ENGINE (SGP4 PHYSICS LAYER)
============================================================
All the orbital mechanics mathematics, fully documented.

THE MATH
--------
1) TLE mean motion n [rev/day] → semi-major axis a:
   Kepler's third law:      n_rad = 2π·n/86400        [rad/s]
                            a = (μ / n_rad²)^(1/3)    [km]

2) Apogee / perigee from eccentricity e:
       r_apo = a(1+e) − R⊕ ,   r_per = a(1−e) − R⊕

3) State vectors come from SGP4 (Vallado 2006 'Revisiting
   Spacetrack Report #3'), giving r⃗, v⃗ in the TEME inertial
   frame (km, km/s).

4) TEME → ECEF rotation by Greenwich Mean Sidereal Time θ:
       GMST (IAU-82):  θ = 280.46061837
                          + 360.98564736629 · d_UT1  (deg, mod 360)
       [x_ecef]   [ cosθ  sinθ 0][x_teme]
       [y_ecef] = [−sinθ  cosθ 0][y_teme]
       [z_ecef]   [  0     0   1][z_teme]

5) Geodetic lat/lon (spherical approx for display):
       lon = atan2(y,x),  lat = asin(z/‖r⃗‖),  alt = ‖r⃗‖ − R⊕
"""
from __future__ import annotations
import math
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

import numpy as np
from sgp4.api import Satrec, jday

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import MU_EARTH, R_EARTH, SECONDS_PER_DAY


# ────────────────────────────────────────────────────────────
@dataclass
class SpaceObject:
    """A tracked object: satellite or debris fragment."""
    name: str
    l1: str
    l2: str
    norad: int = 0
    country: str = "XX"      # IN / JP / INTL / XX
    agency: str = ""
    origin: str = "XX"       # debris origin country
    event: str = ""          # debris source event
    satrec: Optional[Satrec] = field(default=None, repr=False)

    # derived orbital quick-facts
    period_min: float = 0.0
    apogee_km: float = 0.0
    perigee_km: float = 0.0
    inc_deg: float = 0.0
    regime: str = "LEO"

    def __post_init__(self):
        if not self.norad:
            self.norad = int(self.l1[2:7])
        self.satrec = Satrec.twoline2rv(self.l1, self.l2)

        # ---- math: mean motion → a → apogee/perigee ----
        n_rad_min = self.satrec.no_kozai                  # rad/min
        if n_rad_min <= 0:
            raise ValueError("bad mean motion")
        n_rad_s = n_rad_min / 60.0                        # rad/s
        a = (MU_EARTH / n_rad_s**2) ** (1.0 / 3.0)        # km   (Kepler III)
        e = self.satrec.ecco
        self.period_min = 2.0 * math.pi / n_rad_min       # min
        self.apogee_km  = a * (1 + e) - R_EARTH
        self.perigee_km = a * (1 - e) - R_EARTH
        self.inc_deg    = math.degrees(self.satrec.inclo)
        self.regime = ("GEO" if self.apogee_km > 30000
                       else "MEO" if self.apogee_km > 2000 else "LEO")


# ────────────────────────────────────────────────────────────
def propagate(obj: SpaceObject, t: datetime) -> Optional[tuple[np.ndarray, np.ndarray]]:
    """SGP4 → (r⃗ [km], v⃗ [km/s]) in TEME, or None on error."""
    t = t.astimezone(timezone.utc)
    jd, fr = jday(t.year, t.month, t.day, t.hour, t.minute,
                  t.second + t.microsecond * 1e-6)
    err, r, v = obj.satrec.sgp4(jd, fr)
    if err != 0:
        return None
    return np.array(r), np.array(v)


def gmst_rad(t: datetime) -> float:
    """Greenwich Mean Sidereal Time (IAU-82 linear form), radians."""
    t = t.astimezone(timezone.utc)
    jd, fr = jday(t.year, t.month, t.day, t.hour, t.minute,
                  t.second + t.microsecond * 1e-6)
    d = (jd - 2451545.0) + fr                 # days since J2000.0
    theta = (280.46061837 + 360.98564736629 * d) % 360.0
    return math.radians(theta)


def teme_to_ecef(r_teme: np.ndarray, t: datetime) -> np.ndarray:
    """Rotate inertial TEME vector into Earth-fixed ECEF by GMST."""
    th = gmst_rad(t)
    c, s = math.cos(th), math.sin(th)
    R = np.array([[ c, s, 0.0],
                  [-s, c, 0.0],
                  [0.0, 0.0, 1.0]])
    return R @ r_teme


def geodetic(r_ecef: np.ndarray) -> tuple[float, float, float]:
    """(lat°, lon°, alt km) — spherical Earth, display-grade."""
    rng = float(np.linalg.norm(r_ecef))
    lat = math.degrees(math.asin(r_ecef[2] / rng))
    lon = math.degrees(math.atan2(r_ecef[1], r_ecef[0]))
    return lat, lon, rng - R_EARTH


def parse_tle_text(text: str) -> list[dict]:
    """3-line TLE blocks → [{name,l1,l2,norad}, ...]"""
    out, lines = [], [ln.rstrip() for ln in text.splitlines() if ln.strip()]
    i = 0
    while i + 2 < len(lines) + 1:
        if (i + 2 < len(lines) and lines[i + 1].startswith("1 ")
                and lines[i + 2].startswith("2 ")):
            out.append(dict(name=lines[i].strip(), l1=lines[i + 1],
                            l2=lines[i + 2], norad=int(lines[i + 1][2:7])))
            i += 3
        else:
            i += 1
    return out
