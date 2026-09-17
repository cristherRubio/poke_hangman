import aiosmtplib
from email.message import EmailMessage

from app.core.config import settings


async def send_email(to: str, subject: str, body: str) -> None:
    if not settings.SMTP_HOST:
        # Dev fallback — don't silently drop verification/reset links while testing
        print(f"--- EMAIL to {to} ---\n{subject}\n\n{body}\n---")
        return

    msg = EmailMessage()
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)

    await aiosmtplib.send(
        msg,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASSWORD,
        start_tls=True,
    )
