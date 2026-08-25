from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Call, Leads
from app.schemas import CallResponse, LeadResponse

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