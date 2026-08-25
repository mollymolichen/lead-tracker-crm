from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Leads
from app.schemas import LeadResponse, LeadStatusUpdate

router = APIRouter()

# Called by Talkdesk (e.g. a Studio flow's HTTP request action) when a lead's status changes
@router.post(
    "/webhooks/talkdesk/lead-status",
    response_model=LeadResponse
)
def talkdesk_lead_status_webhook(body: LeadStatusUpdate, db: Session = Depends(get_db)):
    lead = db.get(Leads, body.opportunity_id)
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead.stage = body.stage
    if body.enrollment_status is not None:
        lead.enrollment_status = body.enrollment_status

    db.commit()
    db.refresh(lead)
    return lead
