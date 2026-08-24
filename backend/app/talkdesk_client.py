import requests

from app.config import settings


class TalkdeskAuthError(Exception):
    """Raised when Talkdesk OAuth token retrieval fails."""

class TalkdeskAPIError(Exception):
    """Raised when a Talkdesk API request fails."""

'''
Authenticate with Talkdesk using the OAuth 2.0 client credentials grant.
    See: https://docs.talkdesk.com/docs/client-credentials
'''
def get_talkdesk_token() -> str:
    payload = {
        "grant_type": "client_credentials",
        "client_id": settings.talkdesk_client_id,
        "client_secret": settings.talkdesk_client_secret,
        "scope": settings.talkdesk_scope,
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}

    response = requests.post(settings.talkdesk_token_url, data=payload, headers=headers, timeout=10)
    if response.status_code != 200:
        raise TalkdeskAuthError("Failed to fetch OAuth token from Talkdesk")

    token = response.json().get("access_token")
    if not token:
        raise TalkdeskAuthError("Talkdesk token response did not include an access_token")
    return token


'''
Fetch task/case entries from Talkdesk using a freshly issued OAuth token.
    See: https://docs.talkdesk.com/reference/calls-callback-post
'''
def request_talkdesk_callback() -> list[dict]:
    token = get_talkdesk_token()
    payload = {
        "talkdesk_phone_number": "<YOUR_TALKDESK_PHONE_NUMBER>",
        "contact_phone_number": "<CONTACT_PHONE_NUMBER>"
    }
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}

    response = requests.post(f"{settings.talkdesk_api_base_url}/calls/callback", data=payload, headers=headers, timeout=10)
    if response.status_code != 200:
        raise TalkdeskAPIError(f"Talkdesk API call failed with status {response.status_code}")

    return response.json().get("entries", [])
