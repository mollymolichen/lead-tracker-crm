import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Call, Leads
from app.schemas import CallbackRequest, CallbackResult, CallCreate, CallResponse, LeadResponse
from app.talkdesk_client import TalkdeskAPIError, TalkdeskAuthError, request_talkdesk_callback

router = APIRouter()

# Endpoint to get all leads from the database
@router.get("/leads", response_model=list[LeadResponse])
def get_leads(db: Session = Depends(get_db)):
    return db.scalars(select(Leads).order_by(Leads.referral_date, Leads.salesforce_lead_id)).all()

# Endpoint to get call history for a specific lead
@router.get("/leads/{lead_id}/calls", response_model=list[CallResponse])
def get_lead_calls(lead_id: str, db: Session = Depends(get_db)):
    return db.scalars(
        select(Call).where(Call.opportunity_id == lead_id).order_by(Call.call_date.desc())
    ).all()

# Endpoint to create a call record in Postgres from a new note
@router.post("/leads/{lead_id}/calls", response_model=CallResponse, status_code=201)
def create_call_from_note(lead_id: str, body: CallCreate, db: Session = Depends(get_db)):
    # Ensure the lead exists before creating a call
    lead = db.get(Leads, lead_id)
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Create a new call record associated with the lead
    call = Call(
        activity_id=f"-{uuid.uuid4()}", # Generate a unique activity_id for the call
        opportunity_id=lead_id,
        subject="Call",
        call_date=body.call_date,
        call_outcome=body.call_outcome,
        comments=body.comments,
        location=lead.location,
    )
    db.add(call)
    db.commit()
    db.refresh(call)
    return call

# Endpoint to initiate a call to a lead via Talkdesk
@router.post("/leads/{lead_id}/call", response_model=CallbackResult)
def call_lead_from_talkdesk(lead_id: str, body: CallbackRequest, db: Session = Depends(get_db)):
    lead = db.get(Leads, lead_id)
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")

    try:
        request_talkdesk_callback(body.contact_phone_number)
    except (TalkdeskAuthError, TalkdeskAPIError) as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return CallbackResult(status="success", message=f"Talkdesk callback requested for {lead.first_name} {lead.last_name}.")