import { useEffect, useMemo, useRef, useState } from 'react'
import Chart from 'chart.js/auto'
import './Leads.css'
import { rows, countBy } from './mockOpportunities'

const palette = ["#1B96FF", "#2E844A", "#B95000", "#BA0517", "#7B3FE4", "#0B8880", "#8A6D00", "#5867E8"]
const DEFAULT_OWNER = "Angelina Moua"

function stageBadgeClass(stage) {
  return "stage-" + stage.replace(/[^a-zA-Z]+/g, "-").replace(/^-|-$/g, "")
}
function interestClass(v) {
  return { Hot: "pill-hot", Warm: "pill-warm", Cold: "pill-cold", Closed: "pill-closed" }[v] || ""
}

function useChart(canvasRef, config, deps) {
  useEffect(() => {
    if (!canvasRef.current) return undefined
    const chart = new Chart(canvasRef.current, config)
    return () => chart.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

const owners = Array.from(new Set(rows.map((r) => r.accountOwner))).sort()

export default function Dashboard() {
  const [selectedOwner, setSelectedOwner] = useState(DEFAULT_OWNER)

  const filteredRows = useMemo(
    () => (selectedOwner === "All" ? rows : rows.filter((r) => r.accountOwner === selectedOwner)),
    [selectedOwner]
  )
  const total = filteredRows.length

  const stageChartRef = useRef(null)
  const reasonChartRef = useRef(null)
  const interestChartRef = useRef(null)

  const closedWon = filteredRows.filter((r) => r.stage === "Closed Won").length
  const closedLost = filteredRows.filter((r) => r.stage === "Closed Lost").length
  const active = total - closedWon - closedLost
  const conversionRate = total ? ((closedWon / total) * 100).toFixed(1) : "0.0"

  const kpis = [
    { label: "Total Referrals", value: total, delta: "+6 this month", cls: "up" },
    { label: "Active Leads", value: active, delta: `${active} in progress`, cls: "flat" },
    { label: "Enrolled (Closed Won)", value: closedWon, delta: "+1 this month", cls: "up" },
    { label: "Lost", value: closedLost, delta: `${total ? ((closedLost / total) * 100).toFixed(0) : 0}% of total`, cls: "down" },
    { label: "Conversion Rate", value: conversionRate + "%", delta: "Referral → Enrolled", cls: "flat" },
  ]

  const stageCounts = countBy(filteredRows.map((r) => r.stage))
  const reasonCounts = countBy(filteredRows.map((r) => r.reason))
  const interestCounts = countBy(filteredRows.map((r) => r.interest))

  useChart(stageChartRef, {
    type: "bar",
    data: { labels: Object.keys(stageCounts), datasets: [{ data: Object.values(stageCounts), backgroundColor: palette }] },
    options: { indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { display: false } } } },
  }, [selectedOwner])
  useChart(reasonChartRef, {
    type: "bar",
    data: { labels: Object.keys(reasonCounts), datasets: [{ data: Object.values(reasonCounts), backgroundColor: palette }] },
    options: { plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { display: false } } } },
  }, [selectedOwner])
  useChart(interestChartRef, {
    type: "doughnut",
    data: { labels: Object.keys(interestCounts), datasets: [{ data: Object.values(interestCounts), backgroundColor: palette }] },
    options: { plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } } } },
  }, [selectedOwner])

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
        <p className="subtitle">Mock Salesforce view &middot; Referral-to-enrollment pipeline across all Habitat Health locations</p>

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

        <div className="listview">
          <div className="listview-header">
            <h3>My Leads</h3>
            <div className="header-actions">
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
                  <th>Current Enrollment Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r, i) => (
                  <tr key={i}>
                    <td><a className="lead-link" href="#">{r.first} {r.last}</a></td>
                    <td><span className={`badge ${stageBadgeClass(r.stage)}`}>{r.stage}</span></td>
                    <td>{r.reason}</td>
                    <td>{r.org}</td>
                    <td>{r.contact}</td>
                    <td>{r.accountOwner}</td>
                    <td>{r.location}</td>
                    <td>{r.referralDate}</td>
                    <td><span className={interestClass(r.interest)}>{r.interest}</span></td>
                    <td>{r.enrollmentStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="footer-note">1&ndash;{total} of {total} &middot; Sorted by Referral Date</div>
        </div>

        <p className="disclaimer">Mock data generated for prototype purposes only. Field names mirror the columns in
        Central_Dashboard_-_Opportunity_Export.xlsx; no real patient or referral information is shown.</p>
      </div>
    </>
  )
}

