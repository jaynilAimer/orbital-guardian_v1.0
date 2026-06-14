"""
============================================================
CCSDS Conjunction Data Message generator
============================================================
"""
from __future__ import annotations

def filename(event) -> str:
    s1 = event.primary.name.replace(" ", "")[:12]
    s2 = "DEBRIS" + str(event.secondary.norad)
    ts = event.tca.strftime("%Y%m%dT%H%M%S") + "Z"
    return f"CDM_{s1}_{s2}_{ts}.txt"

def generate(event, plan=None) -> str:
    lines = [
        "CCSDS_CDM_VERS               = 1.0",
        f"CREATION_DATE                = {event.tca.isoformat()}",
        "ORIGINATOR                   = ORBITAL_GUARDIAN_AI",
        f"MESSAGE_FOR                  = {event.primary.agency}",
        f"TCA                          = {event.tca.isoformat()}",
        f"MISS_DISTANCE                = {event.miss_km*1000:.1f} [m]",
        f"RELATIVE_SPEED               = {event.v_rel_kms*1000:.1f} [m/s]",
        f"COLLISION_PROBABILITY        = {event.pc:.4e}",
        "COLLISION_PROBABILITY_METHOD = FOSTER-1992",
        "",
        f"OBJECT_NAME                  = {event.primary.name}",
        f"OBJECT_DESIGNATOR            = {event.primary.norad}",
        f"OPERATOR_ORGANIZATION        = {event.primary.agency}",
        "MANEUVERABLE                 = YES",
        "",
        f"OBJECT_NAME                  = {event.secondary.name}",
        f"OBJECT_DESIGNATOR            = {event.secondary.norad}",
        "OBJECT_TYPE                  = DEBRIS",
        "MANEUVERABLE                 = NO",
        "",
    ]
    if plan:
        lines += [
            "COMMENT  --- RECOMMENDED ACTION ---",
            f"DELTA_V                      = {plan.dv_ms:.3f} [m/s]",
            f"FUEL_REQUIRED                = {plan.fuel_kg:.3f} [kg]",
            f"POST_MANEUVER_MISS_DISTANCE  = {plan.new_miss_km*1000:.0f} [m]",
        ]
    else:
        lines.append("RECOMMENDED_ACTION           = MONITOR")
    lines.append("")
    return "\n".join(lines)
