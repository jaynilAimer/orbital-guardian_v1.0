"""
============================================================
PHASE 1.1 — PROPAGATOR ENGINE (SGP4 PHYSICS LAYER)
============================================================
Simplified stub for backend SGP4 propagation.
In production, this would use the python-sgp4 library.
"""
from __future__ import annotations
from datetime import datetime, timezone
import math

def propagate(obj, date: datetime):
    """Return (x,y,z) ECI position in km or None.
    Stub: returns a circular orbit approximation from TLE mean elements."""
    try:
        # Extract orbital elements from TLE line 2
        l2 = obj.l2
        inc = float(l2[8:16]) * math.pi / 180
        raan = float(l2[17:25]) * math.pi / 180
        ecc = float("0." + l2[26:33].strip())
        argp = float(l2[34:42]) * math.pi / 180
        ma = float(l2[43:51]) * math.pi / 180
        n = float(l2[52:63])  # rev/day
        # Mean anomaly at epoch + propagation
        epoch_day = float(obj.l1[20:32])
        current_day = date.timetuple().tm_yday + date.hour/24 + date.minute/1440
        dt_days = current_day - epoch_day
        ma_now = ma + 2 * math.pi * n * dt_days
        # Solve Kepler's equation
        E = ma_now
        for _ in range(10):
            E = ma_now + ecc * math.sin(E)
        # True anomaly
        nu = 2 * math.atan2(math.sqrt(1+ecc)*math.sin(E/2), math.sqrt(1-ecc)*math.cos(E/2))
        # Radius
        a = (398600.4418 / (2*math.pi*n/86400)**2) ** (1/3)
        r = a * (1 - ecc**2) / (1 + ecc * math.cos(nu))
        # Position in orbital plane
        x_orb = r * math.cos(nu)
        y_orb = r * math.sin(nu)
        # Rotate to ECI
        cos_O, sin_O = math.cos(raan), math.sin(raan)
        cos_w, sin_w = math.cos(argp), math.sin(argp)
        cos_i, sin_i = math.cos(inc), math.sin(inc)
        x = (cos_O*cos_w - sin_O*sin_w*cos_i)*x_orb + (-cos_O*sin_w - sin_O*cos_w*cos_i)*y_orb
        y = (sin_O*cos_w + cos_O*sin_w*cos_i)*x_orb + (-sin_O*sin_w + cos_O*cos_w*cos_i)*y_orb
        z = (sin_w*sin_i)*x_orb + (cos_w*sin_i)*y_orb
        return (x, y, z)
    except Exception:
        return None
