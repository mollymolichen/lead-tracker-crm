import { useEffect, useMemo, useState } from 'react'
import { IN_PROGRESS_STAGES, STAGE_ORDER, stageBadgeClass } from './Leads'

// Placeholder until a real Talkdesk deep link (e.g. per-contact profile URL) is wired up
const TALKDESK_PROFILE_URL = "https://www.talkdesk.com/"

function nextStageLabel(stage) {
    const idx = STAGE_ORDER.indexOf(stage)
    return idx === -1 || idx + 1 >= STAGE_ORDER.length ? null : STAGE_ORDER[idx + 1]
}

// Renders the next-step action for a single lead; shared by the Tasks list and LeadPanel's Next Steps section
export function TaskAction({ lead, apiUrl, onStageChange }) {
    const [outreach, setOutreach] = useState(null)
    const [scheduledDate, setScheduledDate] = useState("")
    const [scheduling, setScheduling] = useState(false)
    const [schedulingError, setSchedulingError] = useState(null)

    // Get last outreach date from Talkdesk
    useEffect(() => {
        setOutreach({ loading: true })
        fetch(`${apiUrl}/leads/${lead.id}/calls`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to load call history")
                return res.json()
            })
            .then((calls) => setOutreach({ loading: false, lastCallDate: calls[0]?.call_date ?? null }))
            .catch(() => setOutreach({ loading: false, error: true }))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lead.id, lead.stage])

    // Post a stage change to the Talkdesk webhook, then sync it back into the parent's rows
    function postStageChange(newStage) {
        setScheduling(true)
        setSchedulingError(null)
        fetch(`${apiUrl}/webhooks/talkdesk/lead-status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ opportunity_id: lead.id, stage: newStage }),
        })
            .then(async (res) => {
                const data = await res.json()
                if (!res.ok) throw new Error(data.detail || "Failed to update lead stage")
                onStageChange(lead, newStage)
            })
            .catch((err) => setSchedulingError(err.message))
            .finally(() => setScheduling(false))
    }

    // Schedule the Clinical Home Visit and advance the lead's stage from the task itself
    function scheduleClinicalVisit() {
        if (!scheduledDate) return
        postStageChange("Home Visit - Clinical (ERN)")
    }

    const lastOutreach = (
        <span className="task-detail">
            {outreach?.loading && "Loading last outreach…"}
            {!outreach?.loading && outreach?.error && "Could not load call history"}
            {!outreach?.loading && !outreach?.error &&
                (outreach?.lastCallDate ? `Last outreach: ${outreach.lastCallDate}` : "No outreach recorded yet")}
        </span>
    )

    if (lead.stage === "Initial Engagement") {
        return (
            <>
                {lastOutreach}
                <a className="task-btn task-link" href={TALKDESK_PROFILE_URL} target="_blank" rel="noreferrer">
                    Open Talkdesk Profile
                </a>
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
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                />
                <button
                    type="button"
                    className="task-btn"
                    disabled={!scheduledDate || scheduling}
                    onClick={scheduleClinicalVisit}
                >
                    {scheduling ? "Scheduling…" : "Schedule Clinical Home Visit"}
                </button>
                {schedulingError && <span className="status-error">{schedulingError}</span>}
            </>
        )
    }

    if (lead.stage === "Home Visit - Clinical (ERN)") {
        return (
            <>
                {lastOutreach}
                <a className="task-btn task-link" href="https://www.dhcs.ca.gov/" target="_blank" rel="noreferrer">
                    Submit State Paperwork
                </a>
            </>
        )
    }

    if (lead.stage === "State Review") {
        return (
            <>
                {lastOutreach}
                <button
                    type="button"
                    className="task-btn"
                    disabled={scheduling}
                    onClick={() => postStageChange("Closed Won")}
                >
                    {scheduling ? "Updating…" : "Mark Won"}
                </button>
                <button
                    type="button"
                    className="task-btn task-btn-danger"
                    disabled={scheduling}
                    onClick={() => postStageChange("Closed Lost")}
                >
                    {scheduling ? "Updating…" : "Mark Lost"}
                </button>
                {schedulingError && <span className="status-error">{schedulingError}</span>}
            </>
        )
    }

    const next = nextStageLabel(lead.stage)
    return (
        <>
            {lastOutreach}
            <span className="task-detail">{next ? `Next step: move to ${next}` : "Awaiting next update"}</span>
        </>
    )
}

// rows: owner-filtered leads from the parent Dashboard; setRows updates that same state on stage changes
export default function Tasks({ rows, selectedOwner, apiUrl, setRows, onSelectLead }) {
    // Tasks list: one row per in-progress lead for the selected Account Owner, excluding tasks completed this session
    const [completedTaskIds, setCompletedTaskIds] = useState(() => new Set())
    const taskLeads = useMemo(
        () => rows.filter((r) => IN_PROGRESS_STAGES.includes(r.stage) && !completedTaskIds.has(r.id)),
        [rows, completedTaskIds]
    )

    // Hide a task from the list; this only affects local session state, not the backend
    function markTaskComplete(leadId) {
        setCompletedTaskIds((prev) => new Set(prev).add(leadId))
    }

    function handleStageChange(lead, newStage) {
        setRows((prev) => prev.map((r) => (r.id === lead.id ? { ...r, stage: newStage } : r)))
    }

    return (
        <>
            <div className="tasks-section card">
                <h3>Tasks</h3>
                <p className="tasks-subtitle">
                    Next steps for {selectedOwner === "All" ? "all owners'" : `${selectedOwner}'s`} in-progress leads
                </p>
                {taskLeads.length === 0 && <p className="status-loading">No in-progress leads.</p>}
                <div className="task-list">
                    {taskLeads.map((lead) => (
                        <div className="task-card" key={lead.id}>
                            <button
                                type="button"
                                className="task-complete-btn"
                                aria-label="Mark task complete"
                                onClick={() => markTaskComplete(lead.id)}
                            >
                                &#10003;
                            </button>
                            <div className="task-lead">
                                <a className="lead-link" href="#" onClick={(e) => { e.preventDefault(); onSelectLead(lead) }}>
                                    {lead.first} {lead.last}
                                </a>
                                <span className={`badge ${stageBadgeClass(lead.stage)}`}>{lead.stage}</span>
                            </div>
                            <div className="task-action">
                                <TaskAction lead={lead} apiUrl={apiUrl} onStageChange={handleStageChange} />
                            </div>
                        </div>
                    ))}
                </div>
            </div><br></br>
        </>
    )
}
