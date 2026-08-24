from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Leads
from app.schemas import LeadResponse

router = APIRouter()


@router.get("/leads", response_model=list[LeadResponse])
def get_leads(db: Session = Depends(get_db)):
    return db.scalars(select(Leads).order_by(Leads.referral_date, Leads.salesforce_lead_id)).all()
