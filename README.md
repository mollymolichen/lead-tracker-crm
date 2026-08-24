## Problem
I decided to focus on centralizing and standardizing phone call workflows for ES and OS teams to effectively close patient leads. Each time a phone call is made, the ops teams must manually update two data sources:
1. The lead's Salesforce record
2. Create a new record in the Talkdesk call log

This process is not only prone to human error but also inefficient for the ops team because there's no central place to know what step to take next for each lead.

## Scope

### In Scope
#### No single system of record to track a lead's statuses end-to-end
Instead of updating two data sources (Salesforce, Talkdesk), we can initiate Talkdesk calls directly from our mock Salesforce app.

#### Representatives run phone calls differently
Instead of relying on a spreadsheet or human memory to run phone calls, we will standardize the phone call scripts and initiate calls from a single location, the mock Salesforce app.

### Out of Scope
#### Referral data being inconsistent across different sources
80% of columns from our mock Salesforce/Talkdesk data (Opportunity_Export.csv) represent information
that the Habitat Health Enrollment Specialist (ES) and Outreach Specialist (OS) teams are collecting operationally. I'm assuming the only columns we currently ask our referrals to provide are:
1. Lead First Name
2. Lead Last Name
3. Lead DOB
4. Referral Reason
5. Referring Contact
The remaining columns in our mock data are updated by our internal ops team to track the progress of a lead throughout the enrollment process.

## Success Criteria
How would you measure impact and how would this hold up as it scales to additional centers?
- Outbound call volume
- % of closed deals
- Conversion rate

## Solution Design
How does your prototype work, and where did you use deterministic logic vs. AI? 
What integration points and assumptions did you make?

### TODO - add system design diagram

### Frontend
index.html
    ↓ loads
main.jsx
    ↓ renders
App.jsx
    ↓ renders
Dashboard.jsx

## Architecture
- `frontend/` — React app (Vite)
    - Client can view tasks assigned to them
    - Client can initiate phone calls
- `backend/` — FastAPI app (Python)
    - Syncs task data into PostgreSQL
    - Handles the Talkdesk OAuth 2.0 client-credentials flow
- PostgreSQL — stores synced tasks

### Getting Started
1. Copy env files and fill in your Talkdesk credentials (kept as placeholder for testing):
   ```
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
2. Start Postgres + backend:
   ```
   docker compose up -d
   ```
   Or run the backend locally:
   ```
   cd backend
   python -m venv .venv && .venv/Scripts/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```
3. Start the frontend:
   ```
   cd frontend
   npm install
   npm run dev
   ```

### New integrations
#### Integrate call tracking into Salesforce
Note: Similar plugins are offered by Talkdesk - https://support.talkdesk.com/hc/en-us/articles/360042369171-Setting-up-Talkdesk-Dialer-for-Salesforce

### Out of Scope Integrations
#### Keep Propio for live translation

#### Keep the existing Salesforce CRM
I didn't want to transition off the Salesforce CRM platform because that implies we need to create a new CRM integration altogether. The initial user interface uses a mock Salesforce-like dashboard as the single interface for an ES/OS to manage leads. Knowing that Salesforce isn't the most flexible with task-tracking, I decided to narrow the scope to a custom workflow tracker on top of the mocked Salesforce CRM instance. 

#### Keep Epic for patient data
After the lead's LOC application is approved by the DHCS, they convert from a lead into a patient. The patient's medical forms should remain in Epic EHR. This keeps a clean distinction between the use of Salesforce for leads generation and Epic for patient tracking. We want to minimize the amount of sensitive healthcare information by only storing it for leads, and storing it in a HIPAA-compliant system that's meant to contain PHI.

### Testing
#### Evaluations
TBD