"""Seed the leads table with the mock lead data ported from the frontend prototype."""
import json
from pathlib import Path

from sqlalchemy.dialects.postgresql import insert

from app.database import Base, SessionLocal, engine
from app.models import Leads

SEED_FILE = Path(__file__).parent / "seed_data.json"


def load_seed_rows() -> list[dict]:
    with open(SEED_FILE, encoding="utf-8") as f:
        rows = json.load(f)

    leads = []
    for i, row in enumerate(rows, start=1):
        leads.append({
            "salesforce_lead_id": f"LEAD-{i:04d}",
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


def seed():
    Base.metadata.create_all(bind=engine)
    leads = load_seed_rows()
    table = Leads.__table__

    with SessionLocal() as db:
        stmt = insert(table).values(leads)
        update_cols = {c.name: c for c in stmt.excluded if c.name != "salesforce_lead_id"}
        stmt = stmt.on_conflict_do_update(index_elements=["salesforce_lead_id"], set_=update_cols)
        db.execute(stmt)
        db.commit()

    print(f"Seeded {len(leads)} leads.")


if __name__ == "__main__":
    seed()
