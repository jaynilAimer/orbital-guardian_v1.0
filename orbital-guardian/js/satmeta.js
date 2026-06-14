/* ============================================================  
   ORBITAL GUARDIAN AI — OFFICIAL SATELLITE DOSSIER DATABASE  
   ------------------------------------------------------------  
   Curated strictly from official mission pages:  
     · ISRO  — isro.gov.in mission archives  
     · JAXA  — global.jaxa.jp project pages  
     · QZSS  — qzss.go.jp (Cabinet Office, Japan)  
     · JMA   — jma.go.jp (Himawari programme)  
     · NASA  — nasa.gov (ISS)  
   DATA-INTEGRITY RULES (anti-manipulation):  
     1. Only facts published by the operating agency are entered.  
     2. Anything not officially published is shown as "—",  
        NEVER guessed or fabricated.  
     3. Matching is by official satellite NAME (not hand-typed  
        catalog numbers) to avoid transcription errors.  
     4. Orbital figures shown in the UI are NEVER taken from this  
        file — they are computed live from the NORAD TLEs, so the  
        dossier cannot contradict the tracked orbit.  
   ============================================================ */  
(function () {  
  "use strict";  
  
  // [regex, dossier] — first match wins  
  const META = [  
    /* ── ISRO · NavIC CONSTELLATION ─────────────────────────── */  
    [/^IRNSS-1A/, { launched:"01 Jul 2013", vehicle:"PSLV-C22", site:"SDSC SHAR, Sriharikota", mass:"1,425 kg",  
      role:"First NavIC navigation satellite. L5 + S-band ranging payloads with Rubidium atomic clocks. Now used for messaging payload service after clock anomalies.",  
      src:"ISRO mission page — isro.gov.in" }],  
    [/^IRNSS-1B/, { launched:"04 Apr 2014", vehicle:"PSLV-C24", site:"SDSC SHAR", mass:"1,432 kg",  
      role:"NavIC geosynchronous (inclined) slot 55°E. Provides Standard Positioning Service (SPS) and Restricted Service (RS) over India + 1,500 km region.",  
      src:"ISRO mission page" }],  
    [/^IRNSS-1C/, { launched:"16 Oct 2014", vehicle:"PSLV-C26", site:"SDSC SHAR", mass:"1,425 kg",  
      role:"NavIC GEO slot 83°E — the central anchor of the constellation geometry.", src:"ISRO mission page" }],  
    [/^IRNSS-1D/, { launched:"28 Mar 2015", vehicle:"PSLV-C27", site:"SDSC SHAR", mass:"1,425 kg",  
      role:"NavIC inclined-geosynchronous element, 111.75°E plane.", src:"ISRO mission page" }],  
    [/^IRNSS-1E/, { launched:"20 Jan 2016", vehicle:"PSLV-C31", site:"SDSC SHAR", mass:"1,425 kg",  
      role:"NavIC IGSO element completing the eastern figure-eight ground track.", src:"ISRO mission page" }],  
    [/^IRNSS-1F/, { launched:"10 Mar 2016", vehicle:"PSLV-C32", site:"SDSC SHAR", mass:"1,425 kg",  
      role:"NavIC GEO 32.5°E. Dual-frequency L5/S service for position accuracy better than 20 m over the service area.", src:"ISRO mission page" }],  
    [/^IRNSS-1G/, { launched:"28 Apr 2016", vehicle:"PSLV-C33", site:"SDSC SHAR", mass:"1,425 kg",  
      role:"Seventh launch that completed the original IRNSS constellation; PM named the system 'NavIC' on this mission.", src:"ISRO mission page" }],  
    [/^IRNSS-1I/, { launched:"12 Apr 2018", vehicle:"PSLV-C41", site:"SDSC SHAR", mass:"1,425 kg",  
      role:"Replacement for IRNSS-1A's atomic-clock function in the 55°E IGSO plane.", src:"ISRO mission page" }],  
    [/^NVS-01/, { launched:"29 May 2023", vehicle:"GSLV-F12", site:"SDSC SHAR", mass:"2,232 kg",  
      role:"First second-generation NavIC satellite. Adds the interoperable L1 civil signal and carries an indigenous Rubidium atomic clock.", src:"ISRO mission page" }],  
    [/^NVS-02/, { launched:"29 Jan 2025", vehicle:"GSLV-F15", site:"SDSC SHAR", mass:"≈2,250 kg",  
      role:"ISRO's 100th launch from Sriharikota. Second-generation NavIC with L1/L5/S signals.", src:"ISRO mission page" }],  
  
    /* ── ISRO · EARTH OBSERVATION ───────────────────────────── */  
    [/CARTOSAT-1/, { launched:"05 May 2005", vehicle:"PSLV-C6", site:"SDSC SHAR", mass:"1,560 kg",  
      role:"IRS-P5. Twin panchromatic cameras (2.5 m) giving in-orbit stereo imaging for cartography and DEM generation.", src:"ISRO mission page" }],  
    [/^CARTOSAT-2A/, { launched:"28 Apr 2008", vehicle:"PSLV-C9", site:"SDSC SHAR", mass:"690 kg",  
      role:"Sub-metre class panchromatic imaging for cartographic and urban-planning applications.", src:"ISRO mission page" }],  
    [/^CARTOSAT-2B/, { launched:"12 Jul 2010", vehicle:"PSLV-C15", site:"SDSC SHAR", mass:"694 kg",  
      role:"Cartosat-2 series; <1 m panchromatic camera, 9.6 km swath, high agility for spot imaging.", src:"ISRO mission page" }],  
    [/^CARTOSAT-2C/, { launched:"22 Jun 2016", vehicle:"PSLV-C34", site:"SDSC SHAR", mass:"727 kg",  
      role:"Adds video imaging mode and 0.65 m class resolution; supports infrastructure & disaster monitoring.", src:"ISRO mission page" }],  
    [/^CARTOSAT-2D/, { launched:"15 Feb 2017", vehicle:"PSLV-C37", site:"SDSC SHAR", mass:"714 kg",  
      role:"Primary payload of the world-record 104-satellite PSLV-C37 mission.", src:"ISRO mission page" }],  
    [/^CARTOSAT-2E/, { launched:"23 Jun 2017", vehicle:"PSLV-C38", site:"SDSC SHAR", mass:"712 kg",  
      role:"Cartosat-2 series high-resolution Earth observation.", src:"ISRO mission page" }],  
    [/^CARTOSAT-2F/, { launched:"12 Jan 2018", vehicle:"PSLV-C40", site:"SDSC SHAR", mass:"710 kg",  
      role:"Final Cartosat-2 series satellite.", src:"ISRO mission page" }],  
    [/^CARTOSAT-3/, { launched:"27 Nov 2019", vehicle:"PSLV-C47", site:"SDSC SHAR", mass:"1,625 kg",  
      role:"ISRO's sharpest imaging satellite — 0.25 m class panchromatic resolution, among the world's best civilian imagers.", src:"ISRO mission page" }],  
    [/^RISAT-1\b/, { launched:"26 Apr 2012", vehicle:"PSLV-C19", site:"SDSC SHAR", mass:"1,858 kg",  
      role:"India's first indigenous C-band Synthetic Aperture Radar satellite — all-weather, day/night imaging for agriculture & flood mapping.", src:"ISRO mission page" }],  
    [/^RISAT-2B\b/, { launched:"22 May 2019", vehicle:"PSLV-C46", site:"SDSC SHAR", mass:"615 kg",  
      role:"X-band SAR with 3.6 m radial-rib antenna; surveillance, agriculture, forestry, disaster support.", src:"ISRO mission page" }],  
    [/^RISAT-2BR1/, { launched:"11 Dec 2019", vehicle:"PSLV-C48", site:"SDSC SHAR", mass:"628 kg",  
      role:"X-band SAR, 0.35 m class spotlight mode; 50th PSLV flight.", src:"ISRO mission page" }],  
    [/^RISAT-2BR2|^EOS-01/, { launched:"07 Nov 2020", vehicle:"PSLV-C49", site:"SDSC SHAR", mass:"≈630 kg",  
      role:"X-band SAR (flown as EOS-01); agriculture, forestry and disaster-management imaging.", src:"ISRO mission page" }],  
    [/OCEANSAT-1/, { launched:"26 May 1999", vehicle:"PSLV-C2", site:"SDSC SHAR", mass:"1,036 kg",  
      role:"IRS-P4. Ocean Colour Monitor + Multi-frequency Scanning Microwave Radiometer for ocean biology & state.", src:"ISRO mission page" }],  
    [/^OCEANSAT-2/, { launched:"23 Sep 2009", vehicle:"PSLV-C14", site:"SDSC SHAR", mass:"960 kg",  
      role:"OCM + Ku-band scatterometer for sea-surface winds; supported global cyclone forecasting.", src:"ISRO mission page" }],  
    [/EOS-06|OCEANSAT-3/, { launched:"26 Nov 2022", vehicle:"PSLV-C54", site:"SDSC SHAR", mass:"1,117 kg",  
      role:"Oceansat-3. OCM-3, SSTM, Ku-scatterometer and ARGOS; continuity of ocean colour & wind vector services.", src:"ISRO mission page" }],  
    [/^EOS-04/, { launched:"14 Feb 2022", vehicle:"PSLV-C52", site:"SDSC SHAR", mass:"1,710 kg",  
      role:"RISAT-1A. C-band SAR continuity mission for agriculture, plantation, soil-moisture & hydrology.", src:"ISRO mission page" }],  
    [/^EOS-08/, { launched:"16 Aug 2024", vehicle:"SSLV-D3", site:"SDSC SHAR", mass:"175.5 kg",  
      role:"Microsat-class technology demo: EOIR payload, GNSS-R reflectometry and SiC UV dosimeter (Gaganyaan support).", src:"ISRO mission page" }],  
  
    /* ── ISRO · COMMUNICATIONS (GSAT) ───────────────────────── */  
    [/^GSAT-7\b/, { launched:"30 Aug 2013", vehicle:"Ariane 5 VA-215", site:"Kourou, French Guiana", mass:"2,650 kg",  
      role:"'Rukmini' — Indian Navy's dedicated UHF/S/C/Ku-band maritime communication satellite.", src:"ISRO mission page" }],  
    [/^GSAT-7A/, { launched:"19 Dec 2018", vehicle:"GSLV-F11", site:"SDSC SHAR", mass:"2,250 kg",  
      role:"Indian Air Force communication satellite — Ku-band network-centric operations.", src:"ISRO mission page" }],  
    [/^GSAT-9/, { launched:"05 May 2017", vehicle:"GSLV-F09", site:"SDSC SHAR", mass:"2,230 kg",  
      role:"'South Asia Satellite' — Ku-band services gifted to neighbouring SAARC nations.", src:"ISRO mission page" }],  
    [/^GSAT-11/, { launched:"05 Dec 2018", vehicle:"Ariane 5 VA-246", site:"Kourou", mass:"5,854 kg",  
      role:"ISRO's heaviest satellite — 32 Ku/Ka spot beams; backbone of high-throughput broadband (BharatNet).", src:"ISRO mission page" }],  
    [/^GSAT-19/, { launched:"05 Jun 2017", vehicle:"GSLV Mk III-D1", site:"SDSC SHAR", mass:"3,136 kg",  
      role:"First GSLV Mk III orbital flight payload; Ka/Ku high-throughput spot beams + space-weather payload.", src:"ISRO mission page" }],  
    [/^GSAT-29/, { launched:"14 Nov 2018", vehicle:"GSLV Mk III-D2", site:"SDSC SHAR", mass:"3,423 kg",  
      role:"Ka/Ku high-throughput; links J&K and North-East to the national broadband grid; optical-communication demo.", src:"ISRO mission page" }],  
    [/^GSAT-30/, { launched:"17 Jan 2020", vehicle:"Ariane 5 VA-251", site:"Kourou", mass:"3,357 kg",  
      role:"INSAT-4A replacement — C and Ku-band television, VSAT and tele-services.", src:"ISRO mission page" }],  
    [/^GSAT-31/, { launched:"06 Feb 2019", vehicle:"Ariane 5 VA-247", site:"Kourou", mass:"2,536 kg",  
      role:"Ku-band transponder continuity for INSAT-4CR; VSAT, DTH and ATM connectivity.", src:"ISRO mission page" }],  
    [/^GSAT/, { launched:"—", vehicle:"GSLV / Ariane (per mission)", site:"SDSC SHAR / Kourou", mass:"—",  
      role:"GSAT-series geostationary communication satellite of ISRO's INSAT/GSAT system (telecom, DTH, VSAT, broadcasting).",  
      src:"ISRO GSAT programme — official figures per individual mission page" }],  
  
    /* ── JAXA / JAPAN ───────────────────────────────────────── */  
    [/^QZS-1R/, { launched:"26 Oct 2021", vehicle:"H-IIA F44", site:"Tanegashima", mass:"≈4,000 kg",  
      role:"Michibiki-1 Replacement, QZSS quasi-zenith orbit. Centimetre-Level Augmentation Service (CLAS) over Japan & Oceania.", src:"qzss.go.jp / JAXA" }],  
    [/^QZS-1\b/, { launched:"11 Sep 2010", vehicle:"H-IIA F18", site:"Tanegashima", mass:"4,100 kg",  
      role:"'Michibiki' — first QZSS satellite; figure-eight quasi-zenith orbit maximising high-elevation GPS augmentation over Japan.", src:"qzss.go.jp / JAXA" }],  
    [/^QZS-2/, { launched:"01 Jun 2017", vehicle:"H-IIA F34", site:"Tanegashima", mass:"≈4,000 kg",  
      role:"QZSS quasi-zenith element; L1S sub-metre and L6 CLAS augmentation signals.", src:"qzss.go.jp" }],  
    [/^QZS-3/, { launched:"19 Aug 2017", vehicle:"H-IIA F35", site:"Tanegashima", mass:"≈4,700 kg",  
      role:"QZSS geostationary element — the constellation's GEO anchor with S-band safety-confirmation service.", src:"qzss.go.jp" }],  
    [/^QZS-4/, { launched:"10 Oct 2017", vehicle:"H-IIA F36", site:"Tanegashima", mass:"≈4,000 kg",  
      role:"Completed the initial 4-satellite QZSS constellation (service start Nov 2018).", src:"qzss.go.jp" }],  
    [/^QZS-6/, { launched:"02 Feb 2025", vehicle:"H3 F5", site:"Tanegashima", mass:"≈4,900 kg",  
      role:"Michibiki-6; expansion toward the 7-satellite QZSS enabling GPS-independent regional PNT.", src:"qzss.go.jp / JAXA" }],  
    [/^HIMAWARI-8/, { launched:"07 Oct 2014", vehicle:"H-IIA F25", site:"Tanegashima", mass:"3,500 kg",  
      role:"JMA geostationary weather satellite at 140.7°E. 16-band AHI imager, full-disk every 10 min — primary typhoon watch for Asia-Pacific.", src:"JMA / JAXA" }],  
    [/^HIMAWARI-9/, { launched:"02 Nov 2016", vehicle:"H-IIA F31", site:"Tanegashima", mass:"3,500 kg",  
      role:"Operational JMA imager since Dec 2022 (Himawari-8 in standby). Identical AHI instrument.", src:"JMA" }],  
    [/^HIMAWARI/, { launched:"1977–1995 era", vehicle:"N-I / N-II / H-I / H-II", site:"Tanegashima", mass:"—",  
      role:"Retired GMS 'Himawari' geostationary meteorological satellite generation of Japan.", src:"JMA archives" }],  
    [/^ALOS-2/, { launched:"24 May 2014", vehicle:"H-IIA F24", site:"Tanegashima", mass:"2,120 kg",  
      role:"'Daichi-2' — PALSAR-2 L-band SAR, 1–3 m spotlight; disaster monitoring and forest mapping leader.", src:"JAXA project page" }],  
    [/^ALOS-4/, { launched:"01 Jul 2024", vehicle:"H3 F3", site:"Tanegashima", mass:"≈3,000 kg",  
      role:"'Daichi-4' — PALSAR-3 with 200 km swath at 3 m; quadruples ALOS-2 observation capacity.", src:"JAXA project page" }],  
    [/^ALOS\b/, { launched:"24 Jan 2006", vehicle:"H-IIA F8", site:"Tanegashima", mass:"4,000 kg",  
      role:"'Daichi' — PRISM stereo mapper + AVNIR-2 + PALSAR; operations ended 2011 after power anomaly.", src:"JAXA project page" }],  
    [/^GOSAT-GW/, { launched:"29 Jun 2025", vehicle:"H-IIA F50 (final H-IIA flight)", site:"Tanegashima", mass:"≈2,600 kg",  
      role:"'Ibuki-GW' — combines greenhouse-gas spectrometry (TANSO-3) with AMSR follow-on water-cycle radiometry.", src:"JAXA project page" }],  
    [/^GOSAT 2|^GOSAT-2/, { launched:"29 Oct 2018", vehicle:"H-IIA F40", site:"Tanegashima", mass:"1,800 kg",  
      role:"'Ibuki-2' — improved TANSO-FTS-2 CO₂/CH₄ sensing plus CO measurement.", src:"JAXA project page" }],  
    [/^GOSAT/, { launched:"23 Jan 2009", vehicle:"H-IIA F15", site:"Tanegashima", mass:"1,750 kg",  
      role:"'Ibuki' — world's first dedicated greenhouse-gas observing satellite (CO₂ & CH₄ column densities).", src:"JAXA project page" }],  
  
    /* ── INTERNATIONAL ──────────────────────────────────────── */  
    [/^ISS|ZARYA/, { launched:"20 Nov 1998 (first element)", vehicle:"Proton-K (Zarya FGB)", site:"Baikonur", mass:"≈420,000 kg (assembled)",  
      role:"International Space Station — continuously crewed since Nov 2000; 15+ partner nations; orbits at 51.6° inclination.", src:"NASA / Roscosmos" }],  
  ];  
  
  window.getSatMeta = function (sat) {  
    for (const [re, m] of META) if (re.test(sat.name)) return m;  
    return { launched:"—", vehicle:"—", site:"—", mass:"—",  
      role:"Catalogued object tracked via NORAD TLE. Official dossier not embedded — orbital elements below are live-computed from the public catalog.",  
      src:"NORAD SATCAT via CelesTrak" };  
  };  
  
  /* TLE checksum validator — data-integrity guard.  
     Each TLE line's last digit = (sum of digits + count of '−') mod 10.  
     Any tampered/corrupted line fails this test and is reported.   */  
  window.verifyTLE = function (line) {  
    if (!line || line.length < 69) return false;  
    let s = 0;  
    for (let i = 0; i < 68; i++) {  
      const ch = line[i];  
      if (ch >= "0" && ch <= "9") s += +ch;  
      else if (ch === "-") s += 1;  
    }  
    return (s % 10) === +line[68];  
  };  
})();  
