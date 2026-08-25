import { useEffect, useMemo, useState, Link } from 'react'
import { IN_PROGRESS_STAGES, STAGE_ORDER, stageBadgeClass } from './Leads'

// Placeholder until a real Talkdesk deep link (e.g. per-contact profile URL) is wired up
const TALKDESK_PROFILE_URL = "#"

function nextStageLabel(stage) {
    const idx = STAGE_ORDER.indexOf(stage)
    return idx === -1 || idx + 1 >= STAGE_ORDER.length ? null : STAGE_ORDER[idx + 1]
}

// rows: owner-filtered leads from the parent Dashboard; setRows updates that same state on stage changes
export default function Tasks({ rows, selectedOwner, apiUrl, setRows, onSelectLead }) {
    const [outreachByLead, setOutreachByLead] = useState({})
    const [scheduledDates, setScheduledDates] = useState({})
    const [schedulingLeadId, setSchedulingLeadId] = useState(null)
    const [schedulingError, setSchedulingError] = useState(null)

    // Tasks list: one row per in-progress lead for the selected Account Owner
    const taskLeads = useMemo(
        () => rows.filter((r) => IN_PROGRESS_STAGES.includes(r.stage)),
        [rows]
    )

    // Fetch call history (for "last outreach date") for Initial Engagement leads shown in Tasks
    useEffect(() => {
        const idsNeeded = taskLeads
            .filter((r) => r.stage === "Initial Engagement")
            .map((r) => r.id)
            .filter((id) => !outreachByLead[id])
        idsNeeded.forEach((id) => {
            setOutreachByLead((prev) => ({ ...prev, [id]: { loading: true } }))
            fetch(`${apiUrl}/leads/${id}/calls`)
                .then((res) => {
                    if (!res.ok) throw new Error("Failed to load call history")
                    return res.json()
                })
                .then((calls) => {
                    setOutreachByLead((prev) => ({ ...prev, [id]: { loading: false, lastCallDate: calls[0]?.call_date ?? null } }))
                })
                .catch(() => {
                    setOutreachByLead((prev) => ({ ...prev, [id]: { loading: false, error: true } }))
                })
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [taskLeads])

    // Schedule the Clinical Home Visit and advance the lead's stage from the task itself
    function scheduleClinicalVisit(lead) {
        const date = scheduledDates[lead.id]
        if (!date) return
        setSchedulingLeadId(lead.id)
        setSchedulingError(null)
        fetch(`${apiUrl}/webhooks/talkdesk/lead-status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ opportunity_id: lead.id, stage: "Home Visit - Clinical (ERN)" }),
        })
            .then(async (res) => {
                const data = await res.json()
                if (!res.ok) throw new Error(data.detail || "Failed to update lead stage")
                setRows((prev) => prev.map((r) => (r.id === lead.id ? { ...r, stage: "Home Visit - Clinical (ERN)" } : r)))
            })
            .catch((err) => setSchedulingError(err.message))
            .finally(() => setSchedulingLeadId(null))
    }

    /*export const STAGE_ORDER = [
        "Initial Engagement",
        "Home Visit - Non Clinical",
        "Center Tour",
        "Home Visit - Clinical (ERN)",
        "Follow-up Assessments",
        "State Review",
        "Closed Won",
        "Closed Lost",
    ]*/

    function renderTaskAction(lead) {
        const complete = (<button>Complete</button>)
        const outreach = outreachByLead[lead.id]
        const lastOutreach = (<span className="task-detail">
            {outreach?.loading && "Loading last outreach…"}
            {!outreach?.loading && outreach?.error && "Could not load call history"}
            {!outreach?.loading && !outreach?.error &&
            (outreach?.lastCallDate ? `Last outreach: ${outreach.lastCallDate}` : "No outreach recorded yet")}
        </span>)

        if (lead.stage === "Initial Engagement") {
            return (
                <>
                    {lastOutreach}
                    <a className="task-btn task-link" href={TALKDESK_PROFILE_URL} target="_blank" rel="noreferrer">
                        Open Talkdesk Profile
                    </a>
                    {complete}
                </>
            )
        }

        if (lead.stage === "Home Visit - Non Clinical" || lead.stage === "Center Tour") {
            return (
                <>
                    {lastOutreach}
                    <input
                        type="date"
                        className="task-date-input"
                        value={scheduledDates[lead.id] || ""}
                        onChange={(e) => setScheduledDates((prev) => ({ ...prev, [lead.id]: e.target.value }))}
                    />
                    <button
                        type="button"
                        className="task-btn"
                        disabled={!scheduledDates[lead.id] || schedulingLeadId === lead.id}
                        onClick={() => scheduleClinicalVisit(lead)}
                    >
                        {schedulingLeadId === lead.id ? "Scheduling…" : "Schedule Clinical Home Visit"}
                    </button>
                    {complete}
                </>
            )
        }

        if (lead.stage === "Home Visit - Clinical (ERN)") {
            return (
                <>
                    {lastOutreach}
                    <button
                        type="button"
                        className="task-btn">
                        <Link href="#">Submit State Paperwork</Link>
                    </button>
                    {complete}
                </>
            )
        }

        const next = nextStageLabel(lead.stage)
        return (
            <>
                {lastOutreach}
                <span className="task-detail">{next ? `Next step: move to ${next}` : "Awaiting next update"}</span>
                {complete}
            </>
        )
    }

    return (
        <>
            <div className="tasks-section card">
                <h3>Tasks</h3>
                <p className="tasks-subtitle">
                    Next steps for {selectedOwner === "All" ? "all owners'" : `${selectedOwner}'s`} in-progress leads
                </p>
                {schedulingError && <p className="status-error">{schedulingError}</p>}
                {taskLeads.length === 0 && <p className="status-loading">No in-progress leads.</p>}
                <div className="task-list">
                    {taskLeads.map((lead) => (
                        <div className="task-card" key={lead.id}>
                            <div className="task-lead">
                                <Link className="lead-link" href="#" onClick={(e) => { e.preventDefault(); onSelectLead(lead) }}>
                                    {lead.first} {lead.last}
                                </Link>
                                <span className={`badge ${stageBadgeClass(lead.stage)}`}>{lead.stage}</span>
                            </div>
                            <div className="task-action">{renderTaskAction(lead)}</div>
                        </div>
                    ))}
                </div>
            </div><br></br>
        </>
    )
}
