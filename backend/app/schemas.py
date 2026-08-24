from datetime import date

from pydantic import BaseModel

'''
Pydantic schemas defining the data validation and serialization for API requests and responses.
'''

class TaskResponse(BaseModel):
    task_id: str
    title: str | None = None
    status: str | None = None
    due_date: date | None = None
    importance: str | None = None

    model_config = {"from_attributes": True}


class LeadResponse(BaseModel):
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

    model_config = {"from_attributes": True}


class CallResponse(BaseModel):
    activity_id: str
    opportunity_id: str
    subject: str | None = None
    call_date: date | None = None
    call_success: str | None = None
    call_outcome: str | None = None
    comments: str | None = None
    location: str | None = None

    model_config = {"from_attributes": True}

