import { useEffect, useMemo, useRef, useState } from 'react'
import Chart from 'chart.js/auto'
import LeadPanel from './LeadPanel'
import './Leads.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const palette = ["#1B96FF", "#2E844A", "#B95000", "#BA0517", "#7B3FE4", "#0B8880", "#8A6D00", "#5867E8"]
const DEFAULT_OWNER = "Angelina Moua"
const STAGE_ORDER = [
  "Initial Engagement",
  "Home Visit - Non Clinical",
  "Center Tour",
  "Home Visit - Clinical (ERN)",
  "Follow-up Assessments",
  "State Review",
  "Closed Won",
  "Closed Lost",
]
const IN_PROGRESS_STAGES = STAGE_ORDER.slice(0, 6)
const VIEW_STAGES = {
  "in-progress": IN_PROGRESS_STAGES,
  won: ["Closed Won"],
  lost: ["Closed Lost"],
}

function stageBadgeClass(stage) {
  return "stage-" + stage.replace(/[^a-zA-Z]+/g, "-").replace(/^-|-$/g, "")
}
function interestClass(v) {
  return { Hot: "pill-hot", Warm: "pill-warm", Cold: "pill-cold", Closed: "pill-closed" }[v] || ""
}
function countBy(list) {
  const m = {}
  list.forEach((v) => (m[v] = (m[v] || 0) + 1))
  return m
}

// Map the backend LeadResponse shape onto the fields used by this view
function toRow(lead) {
  return {
    id: lead.salesforce_lead_id,
    first: lead.first_name,
    last: lead.last_name,
    stage: lead.stage,
    reason: lead.referral_reason,
    org: lead.referring_organization,
    contact: lead.referring_contact,
    location: lead.location,
    referralDate: lead.referral_date,
    interest: lead.level_of_interest,
    enrollmentStatus: lead.enrollment_status,
    accountOwner: lead.assignee,
    coldClosedReason: lead.cold_closed_reason
  }
}

function useChart(canvasRef, config, deps) {
  useEffect(() => {
    if (!canvasRef.current) return undefined
    const chart = new Chart(canvasRef.current, config)
    return () => chart.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

export default function Dashboard() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedOwner, setSelectedOwner] = useState(DEFAULT_OWNER)
  const [selectedView, setSelectedView] = useState("in-progress")
  const [selectedLead, setSelectedLead] = useState(null)

  // Fetch leads from the backend API and map them to the row format used by this view
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`${API_URL}/leads`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load leads (${res.status})`)
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setRows(data.map(toRow))
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  // Memoization to avoid recalculating every time the page loads or a filter changes, set to avoid duplicates
  const owners = useMemo(() => Array.from(new Set(rows.map((r) => r.accountOwner))).sort(), [rows])

  // Summary tiles only depend on Account Owner, not the selected view
  const ownerFilteredRows = useMemo(
    () => rows.filter((r) => selectedOwner === "All" || r.accountOwner === selectedOwner),
    [rows, selectedOwner]
  )

  const filteredRows = useMemo(
    () => ownerFilteredRows.filter((r) =>
      !VIEW_STAGES[selectedView] || VIEW_STAGES[selectedView].includes(r.stage)
    ),
    [ownerFilteredRows, selectedView]
  )
  const total = filteredRows.length

  const stageChartRef = useRef(null)
  const reasonChartRef = useRef(null)
  const interestChartRef = useRef(null)

  const ownerTotal = ownerFilteredRows.length
  const closedWon = ownerFilteredRows.filter((r) => r.stage === "Closed Won").length
  const closedLost = ownerFilteredRows.filter((r) => r.stage === "Closed Lost").length
  const active = ownerTotal - closedWon - closedLost
  const conversionRate = ownerTotal ? ((closedWon / ownerTotal) * 100).toFixed(1) : "0.0"

  const kpis = [
    { label: "Total Referrals", value: ownerTotal, delta: "+6 this month", cls: "up" },
    { label: "Active Leads", value: active, delta: `${active} in progress`, cls: "flat" },
    { label: "Enrolled (Closed Won)", value: closedWon, delta: "+1 this month", cls: "up" },
    { label: "Lost", value: closedLost, delta: `${ownerTotal ? ((closedLost / ownerTotal) * 100).toFixed(0) : 0}% of total`, cls: "down" },
    { label: "Conversion Rate", value: conversionRate + "%", delta: "Referral → Enrolled", cls: "flat" },
  ]

  const stageCounts = countBy(filteredRows.map((r) => r.stage))
  const reasonCounts = countBy(filteredRows.map((r) => r.reason))
  const interestCounts = countBy(filteredRows.map((r) => r.interest))

  useChart(stageChartRef, {
    type: "bar",
    data: { labels: Object.keys(stageCounts), datasets: [{ data: Object.values(stageCounts), backgroundColor: palette }] },
    options: { indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { display: false } } } },
  }, [rows, selectedOwner, selectedView])
  useChart(reasonChartRef, {
    type: "bar",
    data: { labels: Object.keys(reasonCounts), datasets: [{ data: Object.values(reasonCounts), backgroundColor: palette }] },
    options: { plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { display: false } } } },
  }, [rows, selectedOwner, selectedView])
  useChart(interestChartRef, {
    type: "doughnut",
    data: { labels: Object.keys(interestCounts), datasets: [{ data: Object.values(interestCounts), backgroundColor: palette }] },
    options: { plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } } } },
  }, [rows, selectedOwner, selectedView])

  return (
    <>
      <div className="topbar">
        <div className="brand"><span className="dot"></span>Habitat Health</div>
        <div className="tabs">
          <span>My Tasks</span>
          <span className="active">My Leads</span>
          <span>Accounts</span>
          <span>Reports</span>
          <span>Dashboards</span>
        </div>
        <div className="right">
          <span>&#128269;</span>
          <span>&#9881;&#65039;</span>
          <div className="avatar">ES</div>
        </div>
      </div>

      <div className="path">My Leads &nbsp;&rsaquo;&nbsp; <b>All Leads</b></div>

      <div className="container">
        <h1 className="page-title">My Leads</h1>
        <p className="subtitle">Live Salesforce/Talkdesk data &middot; Referral-to-enrollment pipeline across all Habitat Health locations</p>

        {loading && <p className="status-loading">Loading leads…</p>}
        {error && <p className="status-error">{error}</p>}

        {!loading && !error && (
          <>
                      <div className="listview">
              <div className="listview-header">
                <h3>My Leads</h3>
                <div className="header-actions">
                  <label className="owner-filter">
                    View:
                    <select value={selectedView} onChange={(e) => setSelectedView(e.target.value)}>
                      <option value="all">All Leads</option>
                      <option value="in-progress">In Progress Leads</option>
                      <option value="won">Won Leads</option>
                      <option value="lost">Lost Leads</option>
                    </select>
                  </label>
                  <label className="owner-filter">
                    Account Owner:
                    <select value={selectedOwner} onChange={(e) => setSelectedOwner(e.target.value)}>
                      <option value="All">All</option>
                      {owners.map((owner) => (
                        <option key={owner} value={owner}>{owner}</option>
                      ))}
                    </select>
                  </label>
                  <span className="count">{total} items</span>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Lead Name</th>
                      <th>Stage</th>
                      <th>Referral Reason</th>
                      <th>Referring Organization</th>
                      <th>Referring Contact</th>
                      <th>Account Owner</th>
                      <th>Location</th>
                      <th>Referral Date</th>
                      <th>Level of Interest</th>
                      {selectedView !== "lost" && <th>Current Enrollment Status</th>}
                      {selectedView !== "in-progress" && <th>Reason for Cold/Closed</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r, i) => (
                      <tr key={i}>
                        <td>
                          <a className="lead-link" href="#" onClick={(e) => { e.preventDefault(); setSelectedLead(r) }}>
                            {r.first} {r.last}
                          </a>
                        </td>
                        <td><span className={`badge ${stageBadgeClass(r.stage)}`}>{r.stage}</span></td>
                        <td>{r.reason}</td>
                        <td>{r.org}</td>
                        <td>{r.contact}</td>
                        <td>{r.accountOwner}</td>
                        <td>{r.location}</td>
                        <td>{r.referralDate}</td>
                        <td><span className={interestClass(r.interest)}>{r.interest}</span></td>
                        {selectedView !== "lost" && <td>{r.enrollmentStatus}</td>}
                        {selectedView !== "in-progress" && <td>{r.coldClosedReason}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="footer-note">1&ndash;{total} of {total} &middot; Sorted by Referral Date</div>
            </div><br></br>

            <div className="kpi-row">
              {kpis.map((k) => (
                <div className="kpi-card" key={k.label}>
                  <div className="label">{k.label}</div>
                  <div className="value">{k.value}</div>
                  <div className={`delta ${k.cls}`}>{k.delta}</div>
                </div>
              ))}
            </div>

            <div className="chart-row">
              <div className="card"><h3>Pipeline by Stage</h3><canvas ref={stageChartRef}></canvas></div>
              <div className="card"><h3>By Referral Reason</h3><canvas ref={reasonChartRef}></canvas></div>
              <div className="card"><h3>Level of Interest</h3><canvas ref={interestChartRef}></canvas></div>
            </div>
          </>
        )}

        <p className="disclaimer">Lead data is served from PostgreSQL via the FastAPI backend
        (seeded from Central_Dashboard_-_Opportunity_Export.xlsx); no real patient or referral information is shown.</p>
      </div>

      <LeadPanel lead={selectedLead} apiUrl={API_URL} onClose={() => setSelectedLead(null)} />
    </>
  )
}

