from sqlalchemy import Column, String, Date

from app.database import Base

'''
SQLAlchemy model defining the database table structure (ORM).
'''

class Staff(Base):
    __tablename__ = "staff"

    staff_id = Column(String, primary_key=True)
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    role = Column(String, nullable=True)


class Leads(Base):
    __tablename__ = "leads"

    salesforce_lead_id = Column(String, primary_key=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    stage = Column(String, nullable=True)
    referral_reason = Column(String, nullable=True)
    referring_organization = Column(String, nullable=True)
    referring_contact = Column(String, nullable=True)
    location = Column(String, nullable=True)
    referral_date = Column(Date, nullable=True)
    referral_source = Column(String, nullable=True)
    level_of_interest = Column(String, nullable=True)
    enrollment_status = Column(String, nullable=True)
    assignee = Column(String, nullable=True)


class Call(Base):
    __tablename__ = "calls"

    activity_id = Column(String, primary_key=True)
    opportunity_id = Column(String, index=True, nullable=False)
    subject = Column(String, nullable=True)
    call_date = Column(Date, nullable=True)
    call_success = Column(String, nullable=True)
    call_outcome = Column(String, nullable=True)
    comments = Column(String, nullable=True)
    location = Column(String, nullable=True)