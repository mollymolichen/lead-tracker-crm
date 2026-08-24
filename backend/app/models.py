from sqlalchemy import Column, String, Date

from app.database import Base

'''
SQLAlchemy model defining the database table structure (ORM).
'''

'''
Task model representing a task in the system.
'''
class Task(Base):
    __tablename__ = "tasks"

    task_id = Column(String, primary_key=True)
    title = Column(String, nullable=True)
    status = Column(String, nullable=True)
    due_date = Column(Date, nullable=True)
    importance = Column(String, nullable=True)
    assignee = Column(String, nullable=True)

class Staff(Base):
    __tablename__ = "staff"

    staff_id = Column(String, primary_key=True)
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    role = Column(String, nullable=True)


class Leads(Base):
    __tablename__ = "leads"

    salesforce_lead_id = Column(String, primary_key=True)
    referral_date = Column(Date, nullable=True)
    referral_source = Column(String, nullable=True)
    assignee = Column(String, nullable=True)