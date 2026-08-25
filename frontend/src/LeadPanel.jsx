import { useEffect, useState } from 'react'

function sortByDateDesc(list) {
  return [...list].sort((a, b) => (a.call_date < b.call_date ? 1 : a.call_date > b.call_date ? -1 : 0))
}

export default function LeadPanel({ lead, apiUrl, onClose }) {
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [contactPhoneNumber, setContactPhoneNumber] = useState('')
  const [calling, setCalling] = useState(false)
  const [callStatus, setCallStatus] = useState(null)
  const [callError, setCallError] = useState(null)

  useEffect(() => {
    if (!lead) return undefined
    let cancelled = false
    setLoading(true)
    setError(null)
    setContactPhoneNumber('')
    setCallStatus(null)
    setCallError(null)
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

  function handleTalkdeskCall() {
    if (!contactPhoneNumber.trim()) {
      setCallError('Enter a phone number to call.')
      return
    }

    setCalling(true)
    setCallStatus(null)
    setCallError(null)
    // Call create_lead_call from leads.py
    fetch(`${apiUrl}/leads/${lead.id}/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact_phone_number: contactPhoneNumber.trim() }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || 'Talkdesk call request failed')
        setCallStatus(data.message)
      })
      .catch((err) => setCallError(err.message))
      .finally(() => setCalling(false))
  }

  return (
    <>
      <div className="lead-panel-overlay" onClick={onClose}></div>
      <aside className="lead-panel">
        <div className="lead-panel-header">
          <h2>{lead.first} {lead.last}</h2>
          <button type="button" className="lead-panel-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <dl className="lead-details">
          <div><dt>Stage</dt><dd>{lead.stage}</dd></div>
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

        <input
          type="tel"
          className="talkdesk-phone-input"
          placeholder="Phone number to call, e.g. +15551234567"
          value={contactPhoneNumber}
          onChange={(e) => setContactPhoneNumber(e.target.value)}
        />
        <button type="button" className="talkdesk-call-btn" onClick={handleTalkdeskCall} disabled={calling}>
          {calling ? "Calling…" : "Talkdesk: Call"}
        </button>
        {callStatus && <p className="status-success">{callStatus}</p>}
        {callError && <p className="status-error">{callError}</p>}

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


