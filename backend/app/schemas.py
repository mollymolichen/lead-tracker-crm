"""Pydantic schema models defining the contract for API requests and responses."""
from datetime import date

from pydantic import BaseModel

class CallResponse(BaseModel):
    """Describe a call returned by the lead call-history endpoint."""

    activity_id: str
    opportunity_id: str
    subject: str | None = None
    call_date: date | None = None
    call_success: str | None = None
    call_outcome: str | None = None
    comments: str | None = None
    location: str | None = None

    model_config = {"from_attributes": True}

class LeadResponse(BaseModel):
    """Describe a lead returned by the API."""

    salesforce_lead_id: str
    first_name: str | None = None
    last_name: str | None = None
    stage: str | None = None
    referral_reason: str | None = None
    referring_organization: str | None = None
    referring_contact: str | None = None
    location: str | None = None
    referral_date: date | None = None
    referral_source: str | None = None
    level_of_interest: str | None = None
    enrollment_status: str | None = None
    assignee: str | None = None
    cold_closed_reason: str | None = None

    model_config = {"from_attributes": True}

class LeadStatusUpdate(BaseModel):
    """Validate a lead status update received from Talkdesk."""

    opportunity_id: str
    stage: str
    enrollment_status: str | None = None

    model_config = {"from_attributes": True}