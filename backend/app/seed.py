"""Seed the leads and calls tables with data ported from the Central Dashboard exports."""
import json
from pathlib import Path

from sqlalchemy.dialects.postgresql import insert

from app.database import Base, SessionLocal, engine
from app.models import Call, Leads

LEADS_SEED_FILE = Path(__file__).parent / "seed_data.json"
CALLS_SEED_FILE = Path(__file__).parent / "seed_data_calls.json"

# Opportunity IDs from Central_Dashboard_-_Opportunity_Export.xlsx, in the same
# row order as seed_data.json / seed_data_calls.json's opportunityId values.
OPPORTUNITY_IDS = [f"006Ak3{i:05d}ZX" for i in range(42)]


def load_lead_rows() -> list[dict]:
    with open(LEADS_SEED_FILE, encoding="utf-8") as f:
        rows = json.load(f)

    leads = []
    for i, row in enumerate(rows):
        leads.append({
            "salesforce_lead_id": OPPORTUNITY_IDS[i],
            "first_name": row["first"],
            "last_name": row["last"],
            "stage": row["stage"],
            "referral_reason": row["reason"],
            "referring_organization": row["org"],
            "referring_contact": row["contact"],
            "location": row["location"],
            "referral_date": row["referralDate"],
            "referral_source": row.get("referralSource"),
            "level_of_interest": row["interest"],
            "enrollment_status": row["enrollmentStatus"],
            "assignee": row["accountOwner"],
        })
    return leads


def load_call_rows() -> list[dict]:
    with open(CALLS_SEED_FILE, encoding="utf-8") as f:
        rows = json.load(f)

    return [{
        "activity_id": row["activityId"],
        "opportunity_id": row["opportunityId"],
        "subject": row["subject"],
        "call_date": row["callDate"],
        "call_success": row["callSuccess"],
        "call_outcome": row["callOutcome"],
        "comments": row["comments"],
        "location": row["location"],
    } for row in rows]


def upsert(db, table, rows, pk_column):
    stmt = insert(table).values(rows)
    update_cols = {c.name: c for c in stmt.excluded if c.name != pk_column}
    stmt = stmt.on_conflict_do_update(index_elements=[pk_column], set_=update_cols)
    db.execute(stmt)


def seed():
    Base.metadata.create_all(bind=engine)
    leads = load_lead_rows()
    calls = load_call_rows()

    with SessionLocal() as db:
        upsert(db, Leads.__table__, leads, "salesforce_lead_id")
        upsert(db, Call.__table__, calls, "activity_id")
        db.commit()

    print(f"Seeded {len(leads)} leads and {len(calls)} calls.")


if __name__ == "__main__":
    seed()
