"""
============================================================
Conjunction screening — Python backend version
============================================================
"""
from __future__ import annotations
import math
from dataclasses import dataclass, field
from datetime import datetime, timezone
from services.propagator import propagate
from services.ml_predictor import risk_score, classify

@dataclass
class ConjunctionEvent:
    primary: object
    secondary: object
    tca: datetime
    miss_km: float
    v_rel_kms: float
    pc: float
    origin: str = "XX"
    band: str = "LOW"
    score: int = 0

    def to_dict(self):
        return dict(
            primary=dict(name=self.primary.name, norad=self.primary.norad,
                         agency=self.primary.agency, country=self.primary.country,
                         regime=self.primary.regime),
            secondary=dict(name=self.secondary.name, norad=self.secondary.norad),
            tca=self.tca.isoformat(),
            miss_km=round(self.miss_km, 3),
            v_rel_kms=round(self.v_rel_kms, 3),
            pc=self.pc,
            origin=self.origin,
            band=self.band,
            score=self.score,
        )

def foster_pc(d_km: float, hbr_m: float = 20, sigma_r: float = 600, sigma_i: float = 1500) -> float:
    sr = sigma_r / 1000; si = sigma_i / 1000; R = hbr_m / 1000
    pc = (R*R / (2*sr*si)) * math.exp(-0.25 * d_km*d_km * (1/(sr*sr) + 1/(si*si)))
    return min(pc, 1.0)

def scan(assets, debris, t0: datetime) -> list[ConjunctionEvent]:
    events = []
    # Simplified screening — production would use full SGP4 propagation
    for a in assets:
        if a.regime == "GEO":
            continue
        for d in debris:
            # Altitude band gate
            if d.perigee_km > a.apogee_km + 50 or d.apogee_km < a.perigee_km - 50:
                continue
            # Coarse sweep (would be SGP4 in production)
            best_d = 999
            best_t = t0
            best_v = 10.0
            for step_s in range(0, 12*3600, 90):
                t = datetime.fromtimestamp(t0.timestamp() + step_s, tz=timezone.utc)
                pa = propagate(a, t)
                pb = propagate(d, t)
                if pa is None or pb is None:
                    continue
                dx = pa[0]-pb[0]; dy = pa[1]-pb[1]; dz = pa[2]-pb[2]
                dist = math.sqrt(dx*dx + dy*dy + dz*dz)
                if dist < best_d:
                    best_d = dist; best_t = t; best_v = 10.0
            if best_d < 50:
                pc = foster_pc(best_d)
                ev = ConjunctionEvent(primary=a, secondary=d, tca=best_t,
                                       miss_km=best_d, v_rel_kms=best_v, pc=pc,
                                       origin=d.origin or "XX")
                ev.band = "CRITICAL" if ev.score >= 75 else "HIGH" if ev.score >= 55 else "MEDIUM" if ev.score >= 30 else "LOW"
                events.append(ev)
    events.sort(key=lambda e: e.miss_km)
    return events[:100]
