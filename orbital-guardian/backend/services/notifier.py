"""
============================================================
PHASE 3.2 — NOTIFICATION SYSTEM (AUTHORITY ALERT DISPATCH)
============================================================
Real multi-channel fan-out for danger-point alerts:

  EMAIL    — SMTP (Gmail App Password / any SMTP relay).
             The CCSDS CDM file is attached to the mail.
  TELEGRAM — Bot API sendMessage (instant phone push).
  WEBHOOK  — generic JSON POST (Slack/Discord/Teams/SIEM).

Credentials come from environment variables so nothing
secret lives in source control:

  OG_SMTP_HOST=smtp.gmail.com   OG_SMTP_PORT=587
  OG_SMTP_USER=you@gmail.com    OG_SMTP_PASS=<app-password>
  OG_ALERT_FROM="Orbital Guardian AI <you@gmail.com>"
  OG_TELEGRAM_TOKEN=123:ABC     OG_TELEGRAM_CHAT=-100123456
  OG_WEBHOOK_URL=https://hooks.slack.com/services/...

Channels with no credentials are skipped gracefully and the
API reports exactly which channels fired.
============================================================
"""
from __future__ import annotations
import json
import os
import smtplib
import urllib.request
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


# ── EMAIL (SMTP) ─────────────────────────────────────────────
def send_email(to: str, subject: str, body: str,
               attachment_name: str = "", attachment_text: str = "") -> tuple[bool, str]:
    host = os.environ.get("OG_SMTP_HOST")
    user = os.environ.get("OG_SMTP_USER")
    pwd = os.environ.get("OG_SMTP_PASS")
    if not (host and user and pwd and to):
        return False, "SMTP not configured (set OG_SMTP_HOST/USER/PASS env vars)"
    port = int(os.environ.get("OG_SMTP_PORT", "587"))
    sender = os.environ.get("OG_ALERT_FROM", user)

    msg = MIMEMultipart()
    msg["From"], msg["To"], msg["Subject"] = sender, to, subject
    msg.attach(MIMEText(body, "plain", "utf-8"))
    if attachment_text:
        part = MIMEApplication(attachment_text.encode(), Name=attachment_name or "CDM.txt")
        part["Content-Disposition"] = f'attachment; filename="{attachment_name or "CDM.txt"}"'
        msg.attach(part)
    try:
        with smtplib.SMTP(host, port, timeout=15) as s:
            s.starttls()
            s.login(user, pwd)
            s.sendmail(sender, [to], msg.as_string())
        return True, "sent"
    except Exception as e:
        return False, f"SMTP error: {e}"


# ── TELEGRAM ─────────────────────────────────────────────────
def send_telegram(text: str) -> tuple[bool, str]:
    token = os.environ.get("OG_TELEGRAM_TOKEN")
    chat = os.environ.get("OG_TELEGRAM_CHAT")
    if not (token and chat):
        return False, "Telegram not configured"
    try:
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{token}/sendMessage",
            data=json.dumps({"chat_id": chat, "text": text[:4000]}).encode(),
            headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status == 200, "sent"
    except Exception as e:
        return False, f"Telegram error: {e}"


# ── GENERIC WEBHOOK (Slack/Discord/Teams/SIEM) ───────────────
def send_webhook(payload: dict) -> tuple[bool, str]:
    url = os.environ.get("OG_WEBHOOK_URL")
    if not url:
        return False, "Webhook not configured"
    try:
        body = {"text": payload.get("subject", "Orbital Guardian alert"),
                "content": payload.get("body", "")[:1900],   # discord field
                "og_alert": payload}
        req = urllib.request.Request(
            url, data=json.dumps(body).encode(),
            headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status in (200, 204), "sent"
    except Exception as e:
        return False, f"Webhook error: {e}"


# ── FAN-OUT ──────────────────────────────────────────────────
def dispatch(payload: dict) -> dict:
    """payload: {to, subject, body, cdm, cdmFilename, severity, agency}"""
    results, detail = {}, {}

    ok, why = send_email(payload.get("to", ""), payload.get("subject", ""),
                         payload.get("body", ""),
                         payload.get("cdmFilename", ""), payload.get("cdm", ""))
    results["email"], detail["email"] = ok, why

    tg_text = payload.get("subject", "") + "\n\n" + payload.get("body", "")
    ok, why = send_telegram(tg_text)
    results["telegram"], detail["telegram"] = ok, why

    ok, why = send_webhook(payload)
    results["webhook"], detail["webhook"] = ok, why

    return {"channels": results, "detail": detail,
            "any_delivered": any(results.values())}
