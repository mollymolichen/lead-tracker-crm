import { useMemo } from 'react'

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function toDateKey(d) {
  return d.toISOString().slice(0, 10)
}

// GitHub-style calendar heatmap (weeks x weekdays) built from { "YYYY-MM-DD": count } referral date counts
export default function ReferralHeatmap({ counts }) {
  const { weeks, maxCount } = useMemo(() => {
    const dateKeys = Object.keys(counts).filter(Boolean).sort()
    if (dateKeys.length === 0) return { weeks: [], maxCount: 0 }

    const start = new Date(dateKeys[0])
    const end = new Date(dateKeys[dateKeys.length - 1])
    // Align the grid to start on a Sunday so weekday rows line up across weeks
    start.setDate(start.getDate() - start.getDay())

    const days = []
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = toDateKey(d)
      days.push({ date: key, count: counts[key] || 0 })
    }

    const weeksList = []
    for (let i = 0; i < days.length; i += 7) {
      weeksList.push(days.slice(i, i + 7))
    }
    return { weeks: weeksList, maxCount: Math.max(...dateKeys.map((k) => counts[k])) }
  }, [counts])

  function levelFor(count) {
    if (count === 0 || maxCount === 0) return 0
    const ratio = count / maxCount
    if (ratio > 0.75) return 4
    if (ratio > 0.5) return 3
    if (ratio > 0.25) return 2
    return 1
  }

  if (weeks.length === 0) return <p className="status-loading">No referral dates to show.</p>

  return (
    <div className="heatmap">
      <div className="heatmap-labels">
        {DAY_LABELS.map((label, i) => (
          <span key={label} className="heatmap-day-label">{i % 2 === 1 ? label : ""}</span>
        ))}
      </div>
      <div className="heatmap-grid">
        {weeks.map((week, wi) => (
          <div className="heatmap-week" key={wi}>
            {week.map((day) => (
              <div
                key={day.date}
                className={`heatmap-cell level-${levelFor(day.count)}`}
                title={`${day.date}: ${day.count} referral${day.count === 1 ? "" : "s"}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
