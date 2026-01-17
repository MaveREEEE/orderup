import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import './Report.css'
import { toast } from 'react-toastify'

const formatCurrency = (n = 0) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(n)

const startOfDay = (d) => {
  const dt = new Date(d)
  dt.setHours(0, 0, 0, 0)
  return dt
}
const endOfDay = (d) => {
  const dt = new Date(d)
  dt.setHours(23, 59, 59, 999)
  return dt
}

const presetRange = (preset) => {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  if (preset === 'thisMonth') return { start: new Date(y, m, 1), end: endOfDay(new Date(y, m + 1, 0)) }
  if (preset === 'lastMonth') return { start: new Date(y, m - 1, 1), end: endOfDay(new Date(y, m, 0)) }
  if (preset === 'thisYear') return { start: new Date(y, 0, 1), end: endOfDay(new Date(y, 11, 31)) }
  return { start: null, end: null } // all time
}

const getWeekNumber = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}

const Report = ({ url, token }) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [preset, setPreset] = useState('thisMonth')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [generatedOn, setGeneratedOn] = useState(new Date())

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await axios.get(url + '/api/order/list', { headers: { token } })
      if (res.data.success) {
        const sorted = (res.data.data || []).sort((a, b) => new Date(b.date) - new Date(a.date))
        setOrders(sorted)
        setGeneratedOn(new Date())
      } else {
        toast.error(res.data.message || 'Failed to fetch orders')
      }
    } catch (err) {
      console.error(err)
      toast.error('Network error fetching orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { start: presetStart, end: presetEnd } = presetRange(preset)
  const filterStart = customStart ? startOfDay(customStart) : presetStart
  const filterEnd = customEnd ? endOfDay(customEnd) : presetEnd

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const d = new Date(o.date)
      const afterStart = filterStart ? d >= filterStart : true
      const beforeEnd = filterEnd ? d <= filterEnd : true
      return afterStart && beforeEnd
    })
  }, [orders, filterStart, filterEnd])

  const totals = useMemo(() => {
    const totalSales = filteredOrders.reduce((s, o) => s + (o.amount || 0), 0)
    const totalOrders = filteredOrders.length
    const delivered = filteredOrders.filter((o) => o.status === 'Delivered').length
    const takeout = filteredOrders.filter((o) => (o.orderType || '').toLowerCase().includes('pick')).length
    const reservations = filteredOrders.filter((o) => o.address?.reservationDate).length
    const avgOrderValue = totalOrders ? totalSales / totalOrders : 0
    return { totalSales, totalOrders, delivered, takeout, reservations, avgOrderValue }
  }, [filteredOrders])

  const categorySummary = useMemo(() => {
    const map = new Map()
    filteredOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const key = item.category || 'Uncategorized'
        const current = map.get(key) || { category: key, qty: 0, sales: 0 }
        const lineSales = (item.price || 0) * (item.quantity || 0)
        current.qty += item.quantity || 0
        current.sales += lineSales
        map.set(key, current)
      })
    })
    return Array.from(map.values()).sort((a, b) => b.sales - a.sales)
  }, [filteredOrders])

  const topItems = useMemo(() => {
    const map = new Map()
    filteredOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const key = item.name || 'Unnamed item'
        const current = map.get(key) || { name: key, qty: 0, sales: 0 }
        const lineSales = (item.price || 0) * (item.quantity || 0)
        current.qty += item.quantity || 0
        current.sales += lineSales
        map.set(key, current)
      })
    })
    return Array.from(map.values())
      .sort((a, b) => b.qty - a.qty || b.sales - a.sales)
      .slice(0, 5)
      .map((it, idx) => ({ ...it, rank: idx + 1 }))
  }, [filteredOrders])

  const dailySummary = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const map = new Map(days.map((d) => [d, { day: d, orders: 0, sales: 0 }]))
    filteredOrders.forEach((o) => {
      const d = days[new Date(o.date).getDay()]
      const entry = map.get(d)
      entry.orders += 1
      entry.sales += o.amount || 0
    })
    return Array.from(map.values())
  }, [filteredOrders])

  const leastItems = useMemo(() => {
    const map = new Map()
    filteredOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const key = item.name || 'Unnamed item'
        const current = map.get(key) || { name: key, qty: 0, sales: 0 }
        const lineSales = (item.price || 0) * (item.quantity || 0)
        current.qty += item.quantity || 0
        current.sales += lineSales
        map.set(key, current)
      })
    })
    return Array.from(map.values())
      .sort((a, b) => a.qty - b.qty || a.sales - b.sales)
      .slice(0, 5)
      .map((it, idx) => ({ ...it, rank: idx + 1 }))
  }, [filteredOrders])

  const weeklySummary = useMemo(() => {
    const map = new Map()
    filteredOrders.forEach((o) => {
      const wk = getWeekNumber(o.date)
      const entry = map.get(wk) || { week: wk, sales: 0 }
      entry.sales += o.amount || 0
      map.set(wk, entry)
    })
    return Array.from(map.values())
      .sort((a, b) => a.week - b.week)
      .map((w) => ({ label: `Week ${w.week}`, value: w.sales }))
  }, [filteredOrders])

  // Daily sales trend for line chart
  const dailyTrend = useMemo(() => {
    const map = new Map()
    filteredOrders.forEach((o) => {
      const dateKey = new Date(o.date).toLocaleDateString('en-CA') // YYYY-MM-DD
      const entry = map.get(dateKey) || { date: dateKey, sales: 0, orders: 0 }
      entry.sales += o.amount || 0
      entry.orders += 1
      map.set(dateKey, entry)
    })
    return Array.from(map.values()).sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [filteredOrders])

  // Peak hours heatmap data
  const peakHours = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, orders: 0 }))
    filteredOrders.forEach((o) => {
      const h = new Date(o.date).getHours()
      hours[h].orders += 1
    })
    return hours
  }, [filteredOrders])

  const pieSlices = categorySummary.map((c) => c.sales)
  const pieLabels = categorySummary.map((c) => c.category)

  const renderBarChartSVG = (values = [], labels = []) => {
    const max = Math.max(...values, 1)
    const width = 340
    const height = Math.max(values.length * 26 + 20, 100)
    const barHeight = 14
    const gap = 12
    const leftLabelWidth = 90
    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
        {values.map((v, i) => {
          const y = i * (barHeight + gap) + 12
          const barW = ((width - leftLabelWidth - 30) * v) / max
          return (
            <g key={i}>
              <text x={4} y={y + 10} fontSize="11" fill="#374151">
                {labels[i]}
              </text>
              <rect x={leftLabelWidth} y={y - 4} width={barW} height={barHeight} rx="6" fill="#ff7043" />
              <text x={leftLabelWidth + barW + 6} y={y + 8} fontSize="11" fill="#374151">
                {formatCurrency(v)}
              </text>
            </g>
          )
        })}
      </svg>
    )
  }

  const renderLineChartSVG = (data = []) => {
    if (!data.length) return null
    const width = 600
    const height = 220
    const padding = { top: 20, right: 40, bottom: 40, left: 60 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    const maxSales = Math.max(...data.map((d) => d.sales), 1)
    const xStep = chartWidth / Math.max(data.length - 1, 1)

    const points = data
      .map((d, i) => {
        const x = padding.left + i * xStep
        const y = padding.top + chartHeight - (d.sales / maxSales) * chartHeight
        return `${x},${y}`
      })
      .join(' ')

    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = padding.top + chartHeight * (1 - pct)
          return (
            <g key={pct}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e5e7eb" strokeWidth="1" />
              <text x={padding.left - 8} y={y + 4} fontSize="11" fill="#6b7280" textAnchor="end">
                {formatCurrency(maxSales * pct)}
              </text>
            </g>
          )
        })}

        {/* Line */}
        <polyline points={points} fill="none" stroke="#ff7043" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Area fill */}
        <polygon
          points={`${padding.left},${padding.top + chartHeight} ${points} ${padding.left + (data.length - 1) * xStep},${padding.top + chartHeight}`}
          fill="url(#lineGradient)"
          opacity="0.2"
        />

        {/* Data points */}
        {data.map((d, i) => {
          const x = padding.left + i * xStep
          const y = padding.top + chartHeight - (d.sales / maxSales) * chartHeight
          return <circle key={i} cx={x} cy={y} r="4" fill="#ff7043" stroke="#fff" strokeWidth="2" />
        })}

        {/* X-axis labels (show some dates) */}
        {data.map((d, i) => {
          if (data.length <= 10 || i % Math.ceil(data.length / 7) === 0 || i === data.length - 1) {
            const x = padding.left + i * xStep
            return (
              <text key={i} x={x} y={height - 10} fontSize="10" fill="#6b7280" textAnchor="middle">
                {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </text>
            )
          }
          return null
        })}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="lineGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ff7043" />
            <stop offset="100%" stopColor="#ff7043" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    )
  }

  const renderHeatmapSVG = (hours = []) => {
    const width = 600
    const height = 120
    const barWidth = width / 24
    const maxOrders = Math.max(...hours.map((h) => h.orders), 1)

    const getHeatColor = (orders) => {
      const intensity = orders / maxOrders
      if (intensity === 0) return '#f3f4f6'
      if (intensity < 0.25) return '#fed7aa'
      if (intensity < 0.5) return '#fdba74'
      if (intensity < 0.75) return '#fb923c'
      return '#f97316'
    }

    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
        {hours.map((h, i) => {
          const x = i * barWidth
          const barHeight = Math.max((h.orders / maxOrders) * 80, 2)
          const y = 90 - barHeight
          return (
            <g key={i}>
              <rect x={x + 2} y={y} width={barWidth - 4} height={barHeight} fill={getHeatColor(h.orders)} rx="3" />
              {h.orders > 0 && (
                <text x={x + barWidth / 2} y={y - 4} fontSize="9" fill="#374151" textAnchor="middle">
                  {h.orders}
                </text>
              )}
              <text x={x + barWidth / 2} y={108} fontSize="9" fill="#6b7280" textAnchor="middle">
                {h.hour}
              </text>
            </g>
          )
        })}
        <text x={width / 2} y={height - 2} fontSize="11" fill="#9ca3af" textAnchor="middle">
          Hour of Day
        </text>
      </svg>
    )
  }

  const renderPieSVG = (slices = [], labels = []) => {
    const size = 160
    const cx = size / 2
    const cy = size / 2
    const radius = 64
    const total = slices.reduce((a, b) => a + b, 0) || 1
    let start = 0
    const colors = ['#ff7043', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s, i) => {
          const portion = s / total
          const end = start + portion
          const large = portion > 0.5 ? 1 : 0
          const startX = cx + radius * Math.cos(2 * Math.PI * start - Math.PI / 2)
          const startY = cy + radius * Math.sin(2 * Math.PI * start - Math.PI / 2)
          const endX = cx + radius * Math.cos(2 * Math.PI * end - Math.PI / 2)
          const endY = cy + radius * Math.sin(2 * Math.PI * end - Math.PI / 2)
          const d = `M ${cx} ${cy} L ${startX} ${startY} A ${radius} ${radius} 0 ${large} 1 ${endX} ${endY} Z`
          start = end
          return <path key={i} d={d} fill={colors[i % colors.length]} stroke="#fff" strokeWidth="1" />
        })}
      </svg>
    )
  }

  return (
    <div className="report-container">
      {/* Print-only header */}
      <div className="print-only-header">
        <h1>Sales Report</h1>
        <p>Generated on: {generatedOn.toLocaleString()}</p>
        <p>
          Period: {filterStart ? filterStart.toLocaleDateString() : 'All time'}
          {filterEnd ? ` - ${filterEnd.toLocaleDateString()}` : ''}
        </p>
      </div>

      <div className="report-header">
        <div>
          <h1>Sales Report</h1>
          <p className="report-subtitle">View, filter, and print summarized sales performance.</p>
        </div>
        <div className="report-actions" data-print-hide>
          <div className="report-meta">
            <span>Generated: {generatedOn.toLocaleString()}</span>
          </div>
          <button className="ghost-btn" onClick={fetchOrders}>
            Refresh
          </button>
          <button className="primary-btn" onClick={() => window.print()}>
            Print
          </button>
        </div>
      </div>

      <div className="report-filters" data-print-hide>
        <div className="filter-group">
          <label>Preset</label>
          <select value={preset} onChange={(e) => setPreset(e.target.value)}>
            <option value="thisMonth">This month</option>
            <option value="lastMonth">Last month</option>
            <option value="thisYear">This year</option>
            <option value="all">All time</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Start date</label>
          <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>End date</label>
          <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
        </div>
        <div className="filter-group inline-note">
          <span>Custom dates override the preset when filled.</span>
        </div>
      </div>

      {loading ? (
        <div className="report-card">Loading report…</div>
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi-card">
              <p className="kpi-label">Total Sales</p>
              <p className="kpi-value accent">{formatCurrency(totals.totalSales)}</p>
              <p className="kpi-note">Sum of all filtered orders</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Total Orders</p>
              <p className="kpi-value">{totals.totalOrders}</p>
              <p className="kpi-note">Orders in range</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Avg Order Value</p>
              <p className="kpi-value">{formatCurrency(totals.avgOrderValue || 0)}</p>
              <p className="kpi-note">Revenue per order</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Delivered / Pick-up</p>
              <p className="kpi-value">
                {totals.delivered} / {totals.takeout}
              </p>
              <p className="kpi-note">Completed by type</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Reservations</p>
              <p className="kpi-value">{totals.reservations}</p>
              <p className="kpi-note">With reservation info</p>
            </div>
          </div>

          <div className="report-grid">
            {/* Sales Trend Line Chart */}
            <div className="report-card chart-wide">
              <div className="card-title">Sales Trend Over Time</div>
              {dailyTrend.length ? (
                <div className="chart-container">{renderLineChartSVG(dailyTrend)}</div>
              ) : (
                <p className="muted">No data for the selected range.</p>
              )}
            </div>

            {/* Peak Hours Heatmap */}
            <div className="report-card chart-wide">
              <div className="card-title">Peak Hours Analysis</div>
              <p className="chart-subtitle">Order volume by hour of day</p>
              {peakHours.some((h) => h.orders > 0) ? (
                <div className="chart-container">{renderHeatmapSVG(peakHours)}</div>
              ) : (
                <p className="muted">No hourly data available.</p>
              )}
            </div>

            <div className="report-card">
              <div className="card-title">Weekly Sales</div>
              {weeklySummary.length ? (
                renderBarChartSVG(
                  weeklySummary.map((w) => w.value),
                  weeklySummary.map((w) => w.label)
                )
              ) : (
                <p className="muted">No data for the selected range.</p>
              )}
            </div>

            <div className="report-card">
              <div className="card-title">Least Performing Items</div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Total Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leastItems.length ? (
                      leastItems.map((it) => (
                        <tr key={it.rank}>
                          <td>{it.rank}</td>
                          <td>{it.name}</td>
                          <td>{it.qty}</td>
                          <td>{formatCurrency(it.sales)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="muted">
                          No data for the selected range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="report-card">
            <div className="card-title">Top Items</div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Total Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {topItems.length ? (
                    topItems.map((it) => (
                      <tr key={it.rank}>
                        <td>{it.rank}</td>
                        <td>{it.name}</td>
                        <td>{it.qty}</td>
                        <td>{formatCurrency(it.sales)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="muted">
                        No data for the selected range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="report-card">
            <div className="card-title">Sales by Day</div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Orders</th>
                    <th>Total Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySummary.map((d) => (
                    <tr key={d.day}>
                      <td>{d.day}</td>
                      <td>{d.orders}</td>
                      <td>{formatCurrency(d.sales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Report