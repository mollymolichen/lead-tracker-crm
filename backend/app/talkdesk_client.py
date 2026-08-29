"""Provide optional authentication and callback helpers for Talkdesk."""

import requests

from app.config import settings

class TalkdeskAuthError(Exception):
    """Raised when Talkdesk OAuth token retrieval fails."""

class TalkdeskAPIError(Exception):
    """Raised when a Talkdesk API request fails."""

def get_talkdesk_token() -> str:
    """Authenticate with Talkdesk and return an OAuth access token."""
    payload = {
        "grant_type": "client_credentials",
        "client_id": settings.talkdesk_client_id,
        "client_secret": settings.talkdesk_client_secret,
        "scope": settings.talkdesk_scope,
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}

    try:
        response = requests.post(settings.talkdesk_token_url, data=payload, headers=headers, timeout=10)
    except requests.exceptions.RequestException as exc:
        raise TalkdeskAuthError(f"Could not reach Talkdesk: {exc}") from exc
    if response.status_code != 200:
        raise TalkdeskAuthError("Failed to fetch OAuth token from Talkdesk")

    token = response.json().get("access_token")
    if not token:
        raise TalkdeskAuthError("Talkdesk token response did not include an access_token")
    return token


def request_talkdesk_callback(contact_phone_number: str) -> dict:
    """Request a Talkdesk callback to the given contact phone number."""
    token = get_talkdesk_token()
    payload = {
        "talkdesk_phone_number": settings.talkdesk_phone_number,
        "contact_phone_number": contact_phone_number,
    }
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}

    try:
        response = requests.post(f"{settings.talkdesk_api_base_url}/calls/callback", data=payload, headers=headers, timeout=10)
    except requests.exceptions.RequestException as exc:
        raise TalkdeskAPIError(f"Could not reach Talkdesk: {exc}") from exc
    if response.status_code not in (200, 201, 202):
        raise TalkdeskAPIError(f"Talkdesk callback request failed with status {response.status_code}")

    return response.json()

