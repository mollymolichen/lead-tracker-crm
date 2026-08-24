import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'
import './Dashboard.css'
import { TOTAL, rows, countBy } from './mockOpportunities'

const palette = ["#1B96FF", "#2E844A", "#B95000", "#BA0517", "#7B3FE4", "#0B8880", "#8A6D00", "#5867E8"]

function stageBadgeClass(stage) {
  return "stage-" + stage.replace(/[^a-zA-Z]+/g, "-").replace(/^-|-$/g, "")
}
function interestClass(v) {
  return { Hot: "pill-hot", Warm: "pill-warm", Cold: "pill-cold", Closed: "pill-closed" }[v] || ""
}

function useChart(canvasRef, config) {
  useEffect(() => {
    if (!canvasRef.current) return undefined
    const chart = new Chart(canvasRef.current, config)
    return () => chart.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

const closedWon = rows.filter((r) => r.stage === "Closed Won").length
const closedLost = rows.filter((r) => r.stage === "Closed Lost").length
const active = TOTAL - closedWon - closedLost
const conversionRate = ((closedWon / TOTAL) * 100).toFixed(1)

const kpis = [
  { label: "Total Referrals", value: TOTAL, delta: "+6 this month", cls: "up" },
  { label: "Active Pipeline", value: active, delta: `${active} in progress`, cls: "flat" },
  { label: "Enrolled (Closed Won)", value: closedWon, delta: "+1 this month", cls: "up" },
  { label: "Closed Lost", value: closedLost, delta: `${((closedLost / TOTAL) * 100).toFixed(0)}% of total`, cls: "down" },
  { label: "Conversion Rate", value: conversionRate + "%", delta: "Referral → Enrolled", cls: "flat" },
]

const stageCounts = countBy(rows.map((r) => r.stage))
const locationCounts = countBy(rows.map((r) => r.location))
const reasonCounts = countBy(rows.map((r) => r.reason))
const interestCounts = countBy(rows.map((r) => r.interest))

export default function Dashboard() {
  const stageChartRef = useRef(null)
  const locationChartRef = useRef(null)
  const reasonChartRef = useRef(null)
  const interestChartRef = useRef(null)

  useChart(stageChartRef, {
    type: "bar",
    data: { labels: Object.keys(stageCounts), datasets: [{ data: Object.values(stageCounts), backgroundColor: palette }] },
    options: { indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { display: false } } } },
  })
  useChart(locationChartRef, {
    type: "doughnut",
    data: { labels: Object.keys(locationCounts), datasets: [{ data: Object.values(locationCounts), backgroundColor: palette }] },
    options: { plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } } } },
  })
  useChart(reasonChartRef, {
    type: "bar",
    data: { labels: Object.keys(reasonCounts), datasets: [{ data: Object.values(reasonCounts), backgroundColor: palette }] },
    options: { plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { display: false } } } },
  })
  useChart(interestChartRef, {
    type: "doughnut",
    data: { labels: Object.keys(interestCounts), datasets: [{ data: Object.values(interestCounts), backgroundColor: palette }] },
    options: { plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } } } },
  })

  return (
    <>
      <div className="topbar">
        <div className="brand"><span className="dot"></span>Habitat Health</div>
        <div className="tabs">
          <span>Home</span>
          <span className="active">Opportunities</span>
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

      <div className="path">Opportunities &nbsp;&rsaquo;&nbsp; <b>Central Dashboard &ndash; Opportunity Export</b></div>

      <div className="container">
        <h1 className="page-title">Central Dashboard &ndash; Opportunity Export</h1>
        <p className="subtitle">Mock Salesforce/Talkdesk view &middot; Referral-to-enrollment pipeline across all Habitat Health locations</p>

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
          <div className="card"><h3>By Location</h3><canvas ref={locationChartRef}></canvas></div>
          <div className="card"><h3>By Referral Reason</h3><canvas ref={reasonChartRef}></canvas></div>
          <div className="card"><h3>Level of Interest</h3><canvas ref={interestChartRef}></canvas></div>
        </div>

        <div className="listview">
          <div className="listview-header">
            <h3>All Opportunities</h3>
            <span className="count">{TOTAL} items</span>
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
                  <th>Location</th>
                  <th>Referral Date</th>
                  <th>Level of Interest</th>
                  <th>Current Enrollment Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td><a className="lead-link" href="#">{r.first} {r.last}</a></td>
                    <td><span className={`badge ${stageBadgeClass(r.stage)}`}>{r.stage}</span></td>
                    <td>{r.reason}</td>
                    <td>{r.org}</td>
                    <td>{r.contact}</td>
                    <td>{r.location}</td>
                    <td>{r.referralDate}</td>
                    <td><span className={interestClass(r.interest)}>{r.interest}</span></td>
                    <td>{r.enrollmentStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="footer-note">1&ndash;{TOTAL} of {TOTAL} &middot; Sorted by Referral Date</div>
        </div>

        <p className="disclaimer">Mock data generated for prototype purposes only. Field names mirror the columns in
        Central_Dashboard_-_Opportunity_Export.xlsx; no real patient or referral information is shown.</p>
      </div>
    </>
  )
}
