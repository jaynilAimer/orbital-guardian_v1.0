"""
============================================================
CelesTrak GP API — live TLE fetcher
============================================================
"""
from __future__ import annotations
import requests
from dataclasses import dataclass

@dataclass
class SpaceObject:
    name: str
    norad: int
    l1: str
    l2: str
    country: str = "XX"
    agency: str = "—"
    regime: str = "LEO"
    perigee_km: float = 0
    apogee_km: float = 0
    inc_deg: float = 0
    period_min: float = 0
    cat: str = "SATELLITE"
    origin: str = "XX"
    event: str = ""

TLE_GROUPS = {
    "NAVIC":    "https://celestrak.org/NORAD/elements/gp.php?NAME=IRNSS&FORMAT=tle",
    "CARTOSAT": "https://celestrak.org/NORAD/elements/gp.php?NAME=CARTOSAT&FORMAT=tle",
    "RISAT":    "https://celestrak.org/NORAD/elements/gp.php?NAME=RISAT&FORMAT=tle",
    "GSAT":     "https://celestrak.org/NORAD/elements/gp.php?NAME=GSAT&FORMAT=tle",
    "QZSS":     "https://celestrak.org/NORAD/elements/gp.php?NAME=QZS&FORMAT=tle",
    "HIMAWARI": "https://celestrak.org/NORAD/elements/gp.php?NAME=HIMAWARI&FORMAT=tle",
    "ALOS":     "https://celestrak.org/NORAD/elements/gp.php?NAME=ALOS&FORMAT=tle",
    "ISS":      "https://celestrak.org/NORAD/elements/gp.php?NAME=ISS&FORMAT=tle",
    "FENGYUN":  "https://celestrak.org/NORAD/elements/gp.php?GROUP=fengyun-1c-debris&FORMAT=tle",
    "COSMOS":   "https://celestrak.org/NORAD/elements/gp.php?GROUP=cosmos-2251-debris&FORMAT=tle",
    "IRIDIUM":  "https://celestrak.org/NORAD/elements/gp.php?GROUP=iridium-33-debris&FORMAT=tle",
}

ASSET_META = {
    "NAVIC": {"country": "IN", "agency": "ISRO", "cat": "NAVIGATION"},
    "CARTOSAT": {"country": "IN", "agency": "ISRO", "cat": "EARTH OBSERVATION"},
    "RISAT": {"country": "IN", "agency": "ISRO", "cat": "EARTH OBSERVATION"},
    "GSAT": {"country": "IN", "agency": "ISRO", "cat": "COMMUNICATION"},
    "QZSS": {"country": "JP", "agency": "JAXA/CABINET", "cat": "NAVIGATION"},
    "HIMAWARI": {"country": "JP", "agency": "JMA", "cat": "WEATHER"},
    "ALOS": {"country": "JP", "agency": "JAXA", "cat": "EARTH OBSERVATION"},
    "ISS": {"country": "XX", "agency": "NASA/ROSCOSMOS", "cat": "CREWED STATION"},
}

DEBRIS_META = {
    "FENGYUN": {"origin": "CN", "event": "2007 Fengyun-1C ASAT test"},
    "COSMOS":  {"origin": "RU", "event": "2009 Cosmos-2251 / Iridium-33 collision"},
    "IRIDIUM": {"origin": "US", "event": "2009 Cosmos-2251 / Iridium-33 collision"},
}

def parse_tle(text: str) -> list[SpaceObject]:
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    objs = []
    for i in range(0, len(lines) - 2):
        if lines[i+1].startswith("1 ") and lines[i+2].startswith("2 "):
            norad = int(lines[i+1][2:7])
            objs.append(SpaceObject(
                name=lines[i].strip(), norad=norad,
                l1=lines[i+1], l2=lines[i+2]))
    return objs

def fetch_group(url: str, timeout: int = 10) -> list[SpaceObject]:
    try:
        r = requests.get(url, timeout=timeout)
        r.raise_for_status()
        return parse_tle(r.text)
    except Exception:
        return []

def load_catalogs(try_live: bool = True):
    assets, debris = [], []
    source = "OFFLINE SNAPSHOT"
    if try_live:
        for group, url in TLE_GROUPS.items():
            objs = fetch_group(url)
            if group in ASSET_META:
                m = ASSET_META[group]
                for o in objs:
                    o.country = m["country"]; o.agency = m["agency"]; o.cat = m["cat"]
                assets.extend(objs)
            elif group in DEBRIS_META:
                m = DEBRIS_META[group]
                for o in objs[:80]:
                    o.origin = m["origin"]; o.event = m["event"]
                    o.country = m["origin"]; o.cat = "DEBRIS"
                debris.extend(objs[:80])
            if objs:
                source = f"LIVE — CelesTrak GP API ({len(assets)} assets, {len(debris)} debris)"
    return assets, debris, source
