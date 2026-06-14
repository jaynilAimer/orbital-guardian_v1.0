"""
============================================================
Maneuver planning — along-track ΔV, Tsiolkovsky fuel
============================================================
"""
from __future__ import annotations
import math
from dataclasses import dataclass
from config import SPACECRAFT

@dataclass
class ManeuverPlan:
    dv_ms: float
    fuel_kg: float
    new_miss_km: float
    pc_before: float
    pc_after: float
    lead_time_s: float
    life_impact_days: float
    feasible: bool

    def to_dict(self):
        return {k: round(v, 4) if isinstance(v, float) else v
                for k, v in self.__dict__.items()}

def plan_maneuver(event) -> ManeuverPlan:
    SC = SPACECRAFT
    tau = max(600, (event.tca.timestamp() - datetime.now(timezone.utc).timestamp()))
    need_km = max(0, 10.0 - event.miss_km)  # target 10 km miss
    dv = (need_km * 1000) / (3 * tau)  # CW drift
    ve = SC["ISP_S"] * SC["G0"]
    fuel = SC["MASS_KG"] * (1 - math.exp(-dv / ve))
    new_miss = event.miss_km + (3 * dv * tau) / 1000
    from services.collision_prob import foster_pc
    pc_after = foster_pc(new_miss)
    life_impact = (fuel / SC["FUEL_BUDGET_KG"]) * 365 * 2
    feasible = fuel < SC["FUEL_BUDGET_KG"] * 0.1 and dv < 5
    return ManeuverPlan(dv_ms=dv, fuel_kg=fuel, new_miss_km=new_miss,
                        pc_before=event.pc, pc_after=pc_after,
                        lead_time_s=tau, life_impact_days=life_impact,
                        feasible=feasible)
