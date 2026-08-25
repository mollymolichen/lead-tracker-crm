import { useEffect, useState } from 'react'
import { STAGE_ORDER } from './Leads'
import { TaskAction } from './Tasks'

function sortByDateDesc(list) {
  return [...list].sort((a, b) => (a.call_date < b.call_date ? 1 : a.call_date > b.call_date ? -1 : 0))
}

export default function LeadPanel({ lead, apiUrl, onClose, onUpdateStage, onTaskStageChange, updatingStageId, stageUpdateError }) {
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!lead) return undefined
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`${apiUrl}/leads/${lead.id}/calls`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load call history (${res.status})`)
        return res.json()
      })
      .then((data) => { if (!cancelled) setCalls(sortByDateDesc(data)) })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [lead, apiUrl])

  if (!lead) return null

  return (
    <>
      <div className="lead-panel-overlay" onClick={onClose}></div>
      <aside className="lead-panel">
        <div className="lead-panel-header">
          <h2>{lead.first} {lead.last}</h2>
          <button type="button" className="lead-panel-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <dl className="lead-details">
          <div>
            <dt>Stage</dt>
            <dd>
              <select
                className="stage-select"
                value={lead.stage}
                disabled={updatingStageId === lead.id}
                onChange={(e) => onUpdateStage(lead, e.target.value)}
              >
                {STAGE_ORDER.map((stage) => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </dd>
          </div>
          {stageUpdateError && <p className="status-error">{stageUpdateError}</p>}

          <div><dt>Referral Reason</dt><dd>{lead.reason}</dd></div>
          <div><dt>Referring Organization</dt><dd>{lead.org}</dd></div>
          <div><dt>Referring Contact</dt><dd>{lead.contact}</dd></div>
          <div><dt>Account Owner</dt><dd>{lead.accountOwner}</dd></div>
          <div><dt>Location</dt><dd>{lead.location}</dd></div>
          <div><dt>Referral Date</dt><dd>{lead.referralDate}</dd></div>
          <div><dt>Level of Interest</dt><dd>{lead.interest}</dd></div>
          {lead.coldClosedReason && <div><dt>Reason for Cold/Close</dt><dd>{lead.coldClosedReason}</dd></div>}
          <div><dt>Current Enrollment Status</dt><dd>{lead.enrollmentStatus}</dd></div>
        </dl>

        <h3 className="lead-panel-section-title">Next Steps</h3>
        <div className="task-action">
          <TaskAction lead={lead} apiUrl={apiUrl} onStageChange={onTaskStageChange} />
        </div>

        <h3 className="lead-panel-section-title">Call History</h3>
        <p className="call-history-source">Synced from Talkdesk</p>
        {loading && <p className="status-loading">Loading call history…</p>}
        {error && <p className="status-error">{error}</p>}
        {!loading && !error && (
          calls.length === 0 ? (
            <p className="status-loading">No calls logged for this lead.</p>
          ) : (
            <div className="call-history">
              {calls.map((c) => (
                <div className="call-entry" key={c.activity_id}>
                  <div className="call-entry-header">
                    <span className="call-date">{c.call_date}</span>
                    {c.call_success && <span className="call-success">{c.call_success}</span>}
                  </div>
                  {c.call_outcome && <div className="call-outcome">{c.call_outcome}</div>}
                  {c.comments && <p className="call-comments">{c.comments}</p>}
                </div>
              ))}
            </div>
          )
        )}
      </aside>
    </>
  )
}


