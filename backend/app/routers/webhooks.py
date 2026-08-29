"""Handle webhook events received from Talkdesk."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Leads
from app.schemas import LeadResponse, LeadStatusUpdate

router = APIRouter()

@router.post(
    "/webhooks/talkdesk/lead-status",
    response_model=LeadResponse
)
def handle_talkdesk_lead_status(body: LeadStatusUpdate, db: Session = Depends(get_db)):
    """Apply a Talkdesk status update to an existing lead."""
    lead = db.get(Leads, body.opportunity_id)
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead.stage = body.stage
    if body.enrollment_status is not None:
        lead.enrollment_status = body.enrollment_status

    db.commit()
    db.refresh(lead)
    return lead
