"""
============================================================
PHASE 4 — FASTAPI BACKEND LAYER
ORBITAL GUARDIAN AI · Sovereign Space Command System

Run:
    cd backend
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
============================================================
"""
from __future__ import annotations
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.celestrak import load_catalogs
from services.collision_prob import scan as run_scan
from services.ml_predictor import risk_score, classify, score_event
from services.avoidance import plan_maneuver
from services.kessler import simulate as kessler_sim
from services import cdm_export
from services.notifier import dispatch as alert_dispatch

app = FastAPI(title="Orbital Guardian AI — Backend",
              description="SGP4 · Foster-1992 Pc · ML risk · Δv optimizer · Kessler · CCSDS CDM")

app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

STATE: dict = {"assets": [], "debris": [], "events": [], "source": "BOOTING"}


@app.on_event("startup")
def boot():
    assets, debris, src = load_catalogs(try_live=True)
    STATE.update(assets=assets, debris=debris, source=src)


@app.get("/api/satellites")
def satellites():
    return dict(source=STATE["source"], count=len(STATE["assets"]), satellites=[
        dict(name=a.name, norad=a.norad, country=a.country, agency=a.agency,
             regime=a.regime, perigee_km=round(a.perigee_km, 1),
             apogee_km=round(a.apogee_km, 1), inc_deg=round(a.inc_deg, 2),
             period_min=round(a.period_min, 2))
        for a in STATE["assets"]])


@app.post("/api/scan")
def scan_now():
    t0 = datetime.now(timezone.utc)
    events = [score_event(e) for e in
              run_scan(STATE["assets"], STATE["debris"], t0)]
    STATE["events"] = events
    return dict(scanned_at=t0.isoformat(), events=[e.to_dict() for e in events])


@app.get("/api/conjunctions")
def conjunctions():
    return dict(count=len(STATE["events"]),
                events=[e.to_dict() for e in STATE["events"]])


class RiskIn(BaseModel):
    pc: float
    miss_km: float
    v_rel_kms: float
    origin: str = "XX"
    model: str = "GENERAL"


@app.post("/api/risk/predict")
def predict(r: RiskIn):
    s = risk_score(r.pc, r.miss_km, r.v_rel_kms, r.origin, r.model)
    return dict(ml_risk=s, classification=classify(s))


class EventRef(BaseModel):
    event_index: int = 0
    with_maneuver: bool = True


@app.post("/api/maneuver/plan")
def maneuver(ref: EventRef):
    if not STATE["events"]:
        raise HTTPException(404, "No events — POST /api/scan first")
    ev = STATE["events"][ref.event_index]
    return plan_maneuver(ev).to_dict()


@app.post("/api/cdm/export")
def cdm(ref: EventRef):
    if not STATE["events"]:
        raise HTTPException(404, "No events — POST /api/scan first")
    ev = STATE["events"][ref.event_index]
    plan = plan_maneuver(ev) if ref.with_maneuver else None
    return dict(filename=cdm_export.filename(ev),
                content=cdm_export.generate(ev, plan))


@app.get("/api/kessler")
def kessler(years: int = 25):
    return kessler_sim(STATE["debris"], years)


class AlertIn(BaseModel):
    to: str = ""
    subject: str
    body: str
    cdm: str = ""
    cdmFilename: str = ""
    severity: str = "HIGH"
    agency: str = "ISRO ISTRAC"
    operator: str = ""


@app.post("/api/alert/dispatch")
def alert(a: AlertIn):
    return alert_dispatch(a.dict())


class OTPMail(BaseModel):
    to: str
    subject: str
    body: str


@app.post("/api/otp/send")
def otp_send(m: OTPMail):
    from services.notifier import send_email
    ok, why = send_email(m.to, m.subject, m.body)
    return dict(delivered=ok, detail=why)
