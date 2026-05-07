from datetime import UTC, datetime, timedelta
from email.message import EmailMessage
from typing import Any
from unittest.mock import AsyncMock, patch

import pytest

from app.services.email import EmailSender


@pytest.fixture()
def sender() -> EmailSender:
    return EmailSender()


def _expires_at() -> datetime:
    return datetime.now(UTC) + timedelta(minutes=10)


@pytest.mark.asyncio
async def test_send_challenge_code_success(sender: EmailSender) -> None:
    with patch("aiosmtplib.send", new_callable=AsyncMock) as mock_send:
        await sender.send_challenge_code(
            email="user@example.com",
            name="Test User",
            code="123456",
            expires_at=_expires_at(),
            purpose="challenge",
            ttl_minutes=10,
        )

    mock_send.assert_awaited_once()
    msg: EmailMessage = mock_send.call_args.args[0]
    assert msg["To"] == "user@example.com"
    assert "123456" in msg["Subject"] or "подтверждения" in msg["Subject"]


@pytest.mark.asyncio
async def test_send_password_reset_subject(sender: EmailSender) -> None:
    with patch("aiosmtplib.send", new_callable=AsyncMock) as mock_send:
        await sender.send_challenge_code(
            email="user@example.com",
            name="Test User",
            code="654321",
            expires_at=_expires_at(),
            purpose="password_reset",
            ttl_minutes=10,
        )

    msg: EmailMessage = mock_send.call_args.args[0]
    assert "пароля" in msg["Subject"]


@pytest.mark.asyncio
async def test_send_smtp_error_does_not_raise(sender: EmailSender) -> None:
    import aiosmtplib

    with patch("aiosmtplib.send", new_callable=AsyncMock, side_effect=aiosmtplib.SMTPException("down")):
        # Must not raise — fire-and-forget contract
        await sender.send_challenge_code(
            email="user@example.com",
            name="Test User",
            code="000000",
            expires_at=_expires_at(),
            purpose="challenge",
            ttl_minutes=10,
        )


@pytest.mark.asyncio
async def test_send_unknown_error_does_not_raise(sender: EmailSender) -> None:
    with patch("aiosmtplib.send", new_callable=AsyncMock, side_effect=RuntimeError("unexpected")):
        await sender.send_challenge_code(
            email="user@example.com",
            name="Test User",
            code="000000",
            expires_at=_expires_at(),
            purpose="challenge",
            ttl_minutes=10,
        )


@pytest.mark.asyncio
async def test_email_contains_code_in_html(sender: EmailSender) -> None:
    with patch("aiosmtplib.send", new_callable=AsyncMock):
        await sender.send_challenge_code(
            email="user@example.com",
            name="Иван",
            code="987654",
            expires_at=_expires_at(),
            purpose="challenge",
            ttl_minutes=10,
        )

    # Verify HTML part includes the code
    import aiosmtplib as _smtp  # noqa: F401 — imported for side-effect  # unused in test body

    # Re-capture via patch to inspect message body
    captured: list[Any] = []

    async def _capture(msg: EmailMessage, **kwargs: Any) -> None:
        captured.append(msg)

    with patch("aiosmtplib.send", new_callable=AsyncMock, side_effect=_capture):
        await sender.send_challenge_code(
            email="user@example.com",
            name="Иван",
            code="987654",
            expires_at=_expires_at(),
            purpose="challenge",
            ttl_minutes=10,
        )

    assert captured
    msg = captured[0]
    html_part = next(
        (part.get_payload(decode=True).decode() for part in msg.walk() if part.get_content_type() == "text/html"),
        "",
    )
    assert "987654" in html_part
    assert "Иван" in html_part
