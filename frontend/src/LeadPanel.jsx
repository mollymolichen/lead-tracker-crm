import { useEffect, useState } from 'react'

export default function LeadPanel({ lead, apiUrl, onClose }) {
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
      .then((data) => { if (!cancelled) setCalls(data) })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [lead, apiUrl])

  if (!lead) return null

  // Talkdesk dialer isn't wired up yet; this is a placeholder for that integration.
  function handleTalkdeskCall() {
    window.alert(`Talkdesk: Call would be placed to ${lead.first} ${lead.last}`)
  }

  return (
    <>
      <div className="lead-panel-overlay" onClick={onClose}></div>
      <aside className="lead-panel">
        <div className="lead-panel-header">
          <h2>{lead.first} {lead.last}</h2>
          <button type="button" className="lead-panel-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <button type="button" className="talkdesk-call-btn" onClick={handleTalkdeskCall}>Talkdesk: Call</button>

        <h3 className="lead-panel-section-title">Call History</h3>
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
                    <span className="call-success">{c.call_success}</span>
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
