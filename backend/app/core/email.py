import resend
from app.core.config import settings

resend.api_key = settings.RESEND_API_KEY


async def send_email(to: str, subject: str, body: str) -> None:
    if not settings.RESEND_API_KEY:
        # Dev fallback — don't silently drop verification/reset links while testing
        print(f"--- EMAIL to {to} ---\n{subject}\n\n{body}\n---")
        return

    resend.Emails.send(
        {
            "from": settings.EMAIL_FROM,
            "to": to,
            "subject": subject,
            "text": body,
        }
    )
