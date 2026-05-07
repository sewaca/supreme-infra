import logging
from datetime import datetime
from email.message import EmailMessage
from email.utils import formataddr
from functools import lru_cache
from pathlib import Path
from typing import Literal

import aiosmtplib
from jinja2 import Environment, FileSystemLoader, select_autoescape
from opentelemetry import metrics

from app.config import settings

logger = logging.getLogger(__name__)

_meter = metrics.get_meter("core-auth")
_email_send_counter = _meter.create_counter(
    "auth_email_send_total",
    description="Total email sends by purpose and result",
)

_SUBJECTS: dict[str, str] = {
    "challenge": "Код подтверждения — ЛК СПбГУТ",
    "password_reset": "Сброс пароля — ЛК СПбГУТ",  # noqa: RUF001
}

_HEADLINES: dict[str, str] = {
    "challenge": "Используйте этот код, чтобы подтвердить действие в личном кабинете СПбГУТ.",
    "password_reset": "Вы запросили сброс пароля. Используйте этот код, чтобы продолжить.",  # noqa: RUF001
}

_TEMPLATES_DIR = Path(__file__).parent.parent / "templates"


class EmailSender:
    def __init__(self) -> None:
        self._env = Environment(
            loader=FileSystemLoader(_TEMPLATES_DIR),
            autoescape=select_autoescape(["html", "xml"]),
        )

    async def send_challenge_code(
        self,
        *,
        email: str,
        name: str,
        code: str,
        expires_at: datetime,
        purpose: Literal["challenge", "password_reset"],
        ttl_minutes: int,
    ) -> None:
        try:
            expires_at_human = expires_at.strftime("%H:%M UTC")
            ctx = {
                "name": name,
                "code": code,
                "headline": _HEADLINES[purpose],
                "ttl_minutes": ttl_minutes,
                "expires_at_human": expires_at_human,
            }
            html_body = self._env.get_template("challenge_code.html").render(**ctx)
            text_body = self._env.get_template("challenge_code.txt").render(**ctx)

            msg = EmailMessage()
            msg["Subject"] = _SUBJECTS[purpose]
            msg["From"] = formataddr((settings.mail_from_name, settings.mail_from))
            msg["To"] = email
            msg.set_content(text_body)
            msg.add_alternative(html_body, subtype="html")

            await aiosmtplib.send(
                msg,
                hostname=settings.smtp_host,
                port=settings.smtp_port,
                username=settings.smtp_username or None,
                password=settings.smtp_password or None,
                use_tls=settings.smtp_use_tls,
                start_tls=settings.smtp_use_starttls,
            )
            _email_send_counter.add(1, {"purpose": purpose, "result": "success"})
            logger.info("[email] sent purpose=%s to=%s", purpose, email)
        except aiosmtplib.SMTPException:
            logger.exception(
                "[email] SMTP failure purpose=%s to=%s smtp=%s:%s user=%s use_tls=%s starttls=%s",
                purpose,
                email,
                settings.smtp_host,
                settings.smtp_port,
                settings.smtp_username or "<no user>",
                settings.smtp_use_tls,
                settings.smtp_use_starttls,
            )
            _email_send_counter.add(1, {"purpose": purpose, "result": "smtp_error"})
        except Exception:
            logger.exception("[email] unknown failure purpose=%s to=%s", purpose, email)
            _email_send_counter.add(1, {"purpose": purpose, "result": "unknown"})


@lru_cache
def get_email_sender() -> EmailSender:
    return EmailSender()
