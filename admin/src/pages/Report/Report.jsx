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
  return { start: null, end: null } 
}

const getWeekNumber = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}

const Calendar = ({ year, month, dateGranularity, onSelect, selectedDate, selectedWeek }) => {
  const getDaysInMonth = (y, m) => new Date(y, m, 0).getDate()
  const getFirstDayOfMonth = (y, m) => new Date(y, m - 1, 1).getDay()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const days = []

  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const parseLocalDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  return (
    <div className="calendar-widget">
      <div className="calendar-header">
        <h3>{monthName}</h3>
      </div>
      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="calendar-dow">
            {d}
          </div>
        ))}
        {days.map((d, idx) => {
          if (d === null) return <div key={`empty-${idx}`} className="calendar-day empty"></div>

          const date = new Date(year, month - 1, d)
          let isSelected = false

          if (dateGranularity === 'daily' && selectedDate) {
            const selectedDateObj = parseLocalDate(selectedDate)
            isSelected = selectedDateObj.toDateString() === date.toDateString()
          } else if (dateGranularity === 'weekly') {
            const weekNum = getWeekNumber(date)
            isSelected = weekNum === selectedWeek
          }

          return (
            <div
              key={d}
              className={`calendar-day ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(date)}
            >
              {d}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const Report = ({ url, token }) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [preset] = useState('thisMonth')
  const [customEnd] = useState('')
  const [dateGranularity, setDateGranularity] = useState('daily')
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedWeek, setSelectedWeek] = useState(getWeekNumber(new Date()))
  const [generatedOn, setGeneratedOn] = useState(new Date())
  const [showCalendarModal, setShowCalendarModal] = useState(false)

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
  }, [])

  const getGranularFilterDates = () => {
    if (dateGranularity === 'yearly') {
      return {
        start: new Date(calendarYear, 0, 1),
        end: endOfDay(new Date(calendarYear, 11, 31))
      }
    } else if (dateGranularity === 'monthly') {
      return {
        start: new Date(calendarYear, calendarMonth - 1, 1),
        end: endOfDay(new Date(calendarYear, calendarMonth, 0))
      }
    } else if (dateGranularity === 'weekly') {
      const jan1 = new Date(calendarYear, 0, 1)
      const startDate = new Date(jan1)
      startDate.setDate(jan1.getDate() + (selectedWeek - 1) * 7)
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      return {
        start: startDate,
        end: endOfDay(endDate)
      }
    } else {
      if (selectedDate && customEnd) {
        return {
          start: startOfDay(selectedDate),
          end: endOfDay(customEnd)
        }
      } else if (selectedDate) {
        return {
          start: startOfDay(selectedDate),
          end: endOfDay(selectedDate)
        }
      }
      const { start: presetStart, end: presetEnd } = presetRange(preset)
      return { start: presetStart, end: presetEnd }
    }
  }

  const { start: granularStart, end: granularEnd } = getGranularFilterDates()

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const d = new Date(o.date)
      const afterStart = granularStart ? d >= granularStart : true
      const beforeEnd = granularEnd ? d <= granularEnd : true
      return afterStart && beforeEnd
    })
  }, [orders, granularStart, granularEnd])

  const totals = useMemo(() => {
    const totalSales = filteredOrders.reduce((s, o) => s + (o.amount || 0), 0)
    const totalOrders = filteredOrders.length
    const delivered = filteredOrders.filter((o) => o.status === 'Food is delivered' || o.status === 'Delivered').length
    const pickup = filteredOrders.filter((o) => (o.orderType || '').toLowerCase().includes('pick')).length
    const dineIn = filteredOrders.filter((o) => (o.orderType || '').toLowerCase().includes('dine')).length
    const reservations = filteredOrders.filter((o) => o.address?.reservationDate).length
    const avgOrderValue = totalOrders ? totalSales / totalOrders : 0
    return { totalSales, totalOrders, delivered, pickup, dineIn, reservations, avgOrderValue }
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
      .sort((a, b) => b.sales - a.sales || b.qty - a.qty)
      .slice(0, 5)
      .map((it, idx) => ({ ...it, rank: idx + 1 }))
  }, [filteredOrders])

  const leastOrdered = useMemo(() => {
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

  const dailyTrend = useMemo(() => {
    const map = new Map()
    filteredOrders.forEach((o) => {
      const dateKey = new Date(o.date).toLocaleDateString('en-CA') 
      const entry = map.get(dateKey) || { date: dateKey, sales: 0, orders: 0 }
      entry.sales += o.amount || 0
      entry.orders += 1
      map.set(dateKey, entry)
    })
    return Array.from(map.values()).sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [filteredOrders])

  const peakHours = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, orders: 0 }))
    filteredOrders.forEach((o) => {
      const h = new Date(o.date).getHours()
      hours[h].orders += 1
    })
    return hours
  }, [filteredOrders])

  const orderTypeRevenue = useMemo(() => {
    const revenue = { delivery: 0, pickup: 0, dineIn: 0 }
    filteredOrders.forEach((o) => {
      const type = (o.orderType || '').toLowerCase()
      if (type.includes('pick')) {
        revenue.pickup += o.amount || 0
      } else if (type.includes('dine')) {
        revenue.dineIn += o.amount || 0
      } else {
        revenue.delivery += o.amount || 0
      }
    })
    return [
      { label: 'Delivery', value: revenue.delivery },
      { label: 'Pick-up', value: revenue.pickup },
      { label: 'Dine-in', value: revenue.dineIn }
    ].filter(item => item.value > 0)
  }, [filteredOrders])

  const renderLineChartSVG = (data = []) => {
    if (!data.length) return null
    const width = 600
    const height = 220
    const padding = { top: 20, right: 40, bottom: 40, left: 60 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    const maxSalesVal = Math.max(...data.map((d) => d.sales), 1)
    const step = maxSalesVal <= 500 ? 100 : maxSalesVal <= 5000 ? 500 : maxSalesVal <= 50000 ? 5000 : 50000
    const maxSales = Math.ceil(maxSalesVal / step) * step
    const xStep = chartWidth / Math.max(data.length - 1, 1)

    const points = data
      .map((d, i) => {
        const x = padding.left + i * xStep
        const y = padding.top + chartHeight - (d.sales / maxSales) * chartHeight
        return `${x},${y}`
      })
      .join(' ')

    const gridLines = []
    for (let val = 0; val <= maxSales; val += 500) {
      gridLines.push(val)
    }

    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
        {gridLines.map((val) => {
          const pct = val / maxSales
          const y = padding.top + chartHeight * (1 - pct)
          return (
            <g key={val}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e5e7eb" strokeWidth="1" />
              <text x={padding.left - 8} y={y + 4} fontSize="11" fill="#6b7280" textAnchor="end">
                {formatCurrency(val)}
              </text>
            </g>
          )
        })}

        <polyline points={points} fill="none" stroke="#ff7043" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        <polygon
          points={`${padding.left},${padding.top + chartHeight} ${points} ${padding.left + (data.length - 1) * xStep},${padding.top + chartHeight}`}
          fill="url(#lineGradient)"
          opacity="0.2"
        />

        {data.map((d, i) => {
          const x = padding.left + i * xStep
          const y = padding.top + chartHeight - (d.sales / maxSales) * chartHeight
          return <circle key={i} cx={x} cy={y} r="4" fill="#ff7043" stroke="#fff" strokeWidth="2" />
        })}

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

  const renderPieSVG = (slices = []) => {
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
      <div className="print-only-header">
        <h1>Sales Report</h1>
        <p>Generated on: {generatedOn.toLocaleString()}</p>
        <p>
          Period: {granularStart ? granularStart.toLocaleDateString() : 'All time'}
          {granularEnd ? ` - ${granularEnd.toLocaleDateString()}` : ''}
        </p>
      </div>

      <div className="report-header">
        <div>
          <h1>Sales Report</h1>
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
          <label>Filter</label>
          <select value={dateGranularity} onChange={(e) => {
            setDateGranularity(e.target.value)
            setShowCalendarModal(true)
          }}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <button
          type="button"
          className="ghost-btn"
          onClick={() => setShowCalendarModal(true)}
        >
          Select {dateGranularity === 'daily' ? 'Date' : dateGranularity === 'weekly' ? 'Week' : dateGranularity === 'monthly' ? 'Month' : 'Year'}
        </button>

        {selectedDate && dateGranularity === 'daily' && (
          <div className="selected-badge">
            {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {customEnd && ` to ${new Date(customEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
          </div>
        )}

        {dateGranularity === 'weekly' && (
          <div className="selected-badge">
            {(() => {
              const jan1 = new Date(calendarYear, 0, 1)
              const startDate = new Date(jan1)
              startDate.setDate(jan1.getDate() + (selectedWeek - 1) * 7)
              const endDate = new Date(startDate)
              endDate.setDate(startDate.getDate() + 6)
              return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            })()}
          </div>
        )}

        {dateGranularity === 'monthly' && (
          <div className="selected-badge">
            {new Date(calendarYear, calendarMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        )}

        {dateGranularity === 'yearly' && (
          <div className="selected-badge">
            {calendarYear}
          </div>
        )}
      </div>

      {showCalendarModal && (
        <div className="modal-overlay" onClick={() => setShowCalendarModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select {dateGranularity === 'daily' ? 'Date' : dateGranularity === 'weekly' ? 'Week' : dateGranularity === 'monthly' ? 'Month' : 'Year'}</h2>
              <button className="modal-close" onClick={() => setShowCalendarModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              {dateGranularity === 'yearly' && (
                <div className="year-picker-modal">
                  <label>Select Year</label>
                  <div className="year-controls">
                    <button onClick={() => setCalendarYear(calendarYear - 1)}>◀</button>
                    <input 
                      type="number" 
                      min="2020" 
                      max={new Date().getFullYear() + 1}
                      value={calendarYear} 
                      onChange={(e) => setCalendarYear(parseInt(e.target.value))}
                    />
                    <button onClick={() => setCalendarYear(calendarYear + 1)}>▶</button>
                  </div>
                </div>
              )}

              {dateGranularity === 'monthly' && (
                <>
                  <div className="year-controls">
                    <button onClick={() => setCalendarYear(calendarYear - 1)}>◀ Year</button>
                    <input 
                      type="number" 
                      min="2020" 
                      max={new Date().getFullYear() + 1}
                      value={calendarYear} 
                      onChange={(e) => setCalendarYear(parseInt(e.target.value))}
                    />
                    <button onClick={() => setCalendarYear(calendarYear + 1)}>Year ▶</button>
                  </div>
                  <div className="months-grid">
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, idx) => (
                      <button
                        key={idx + 1}
                        className={`month-btn ${calendarMonth === idx + 1 ? 'selected' : ''}`}
                        onClick={() => {
                          setCalendarMonth(idx + 1)
                          setShowCalendarModal(false)
                        }}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {dateGranularity === 'weekly' && (
                <>
                  <div className="month-nav">
                    <button onClick={() => {
                      if (calendarMonth === 1) {
                        setCalendarMonth(12)
                        setCalendarYear(calendarYear - 1)
                      } else {
                        setCalendarMonth(calendarMonth - 1)
                      }
                    }}>Prev</button>
                    <h3>{new Date(calendarYear, calendarMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                    <button onClick={() => {
                      if (calendarMonth === 12) {
                        setCalendarMonth(1)
                        setCalendarYear(calendarYear + 1)
                      } else {
                        setCalendarMonth(calendarMonth + 1)
                      }
                    }}>Next </button>
                  </div>
                  <Calendar 
                    year={calendarYear} 
                    month={calendarMonth}
                    dateGranularity="weekly"
                    onSelect={(date) => {
                      const weekNum = getWeekNumber(date)
                      setSelectedWeek(weekNum)
                      setCalendarYear(date.getFullYear())
                      setCalendarMonth(date.getMonth() + 1)
                    }}
                    selectedDate={null}
                    selectedWeek={selectedWeek}
                  />
                </>
              )}

              {dateGranularity === 'daily' && (
                <>
                  <div className="month-nav">
                    <button onClick={() => {
                      if (calendarMonth === 1) {
                        setCalendarMonth(12)
                        setCalendarYear(calendarYear - 1)
                      } else {
                        setCalendarMonth(calendarMonth - 1)
                      }
                    }}>◀ Prev</button>
                    <h3>{new Date(calendarYear, calendarMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                    <button onClick={() => {
                      if (calendarMonth === 12) {
                        setCalendarMonth(1)
                        setCalendarYear(calendarYear + 1)
                      } else {
                        setCalendarMonth(calendarMonth + 1)
                      }
                    }}>Next ▶</button>
                  </div>
                  <Calendar 
                    year={calendarYear} 
                    month={calendarMonth}
                    dateGranularity="daily"
                    onSelect={(date) => {
                      const year = date.getFullYear()
                      const month = String(date.getMonth() + 1).padStart(2, '0')
                      const day = String(date.getDate()).padStart(2, '0')
                      const dateStr = `${year}-${month}-${day}`
                      setSelectedDate(dateStr)
                      setCalendarYear(date.getFullYear())
                      setCalendarMonth(date.getMonth() + 1)
                    }}
                    selectedDate={selectedDate}
                  />
                </>
              )}
            </div>

            <div className="modal-footer">
              <button className="ghost-btn" onClick={() => setShowCalendarModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="report-card">Loading report…</div>
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi-card">
              <p className="kpi-label">Total Sales</p>
              <p className="kpi-value accent">{formatCurrency(totals.totalSales)}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Total Orders</p>
              <p className="kpi-value">{totals.totalOrders}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Avg Order Value</p>
              <p className="kpi-value">{formatCurrency(totals.avgOrderValue || 0)}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Delivered</p>
              <p className="kpi-value">{totals.delivered}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Pick-up</p>
              <p className="kpi-value">{totals.pickup}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Dine-in</p>
              <p className="kpi-value">{totals.dineIn}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Reservations</p>
              <p className="kpi-value">{totals.reservations}</p>
            </div>
          </div>

          <div className="report-grid">
            <div className="report-card">
              <div className="card-title">Best Sellers</div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th className="text-right">Total Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topItems.length ? (
                      topItems.map((it) => (
                        <tr key={it.rank}>
                          <td>{it.rank}</td>
                          <td>{it.name}</td>
                          <td>{it.qty}</td>
                          <td className="text-right">{formatCurrency(it.sales)}</td>
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
              <div className="card-title">Least Ordered Items</div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th className="text-right">Total Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leastOrdered.length ? (
                      leastOrdered.map((it) => (
                        <tr key={it.rank}>
                          <td>{it.rank}</td>
                          <td>{it.name}</td>
                          <td>{it.qty}</td>
                          <td className="text-right">{formatCurrency(it.sales)}</td>
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

          <div className="report-grid">
            <div className="report-card">
              <div className="card-title">Revenue by Order Type</div>
              {orderTypeRevenue.length > 0 ? (
                <>
                  <div className="chart-container" style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                    {renderPieSVG(
                      orderTypeRevenue.map(item => item.value),
                      orderTypeRevenue.map(item => item.label)
                    )}
                  </div>
                  <div className="pie-legend">
                    {orderTypeRevenue.map((item, idx) => {
                      const colors = ['#ff7043', '#10b981', '#3b82f6']
                      const total = orderTypeRevenue.reduce((sum, i) => sum + i.value, 0)
                      const percentage = ((item.value / total) * 100).toFixed(1)
                      return (
                        <div key={idx} className="legend-item">
                          <span className="legend-color" style={{ backgroundColor: colors[idx] }}></span>
                          <span className="legend-label">{item.label}</span>
                          <span className="legend-value">{formatCurrency(item.value)} ({percentage}%)</span>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <p className="muted">No order type data available.</p>
              )}
            </div>

            <div className="report-card">
              <div className="card-title">Sales by Category</div>
              {categorySummary.length > 0 ? (
                <>
                  <div className="chart-container" style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                    {renderPieSVG(
                      categorySummary.map(item => item.sales),
                      categorySummary.map(item => item.category)
                    )}
                  </div>
                  <div className="pie-legend">
                    {categorySummary.map((item, idx) => {
                      const colors = ['#ff7043', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']
                      const total = categorySummary.reduce((sum, i) => sum + i.sales, 0)
                      const percentage = ((item.sales / total) * 100).toFixed(1)
                      return (
                        <div key={idx} className="legend-item">
                          <span className="legend-color" style={{ backgroundColor: colors[idx % colors.length] }}></span>
                          <span className="legend-label">{item.category}</span>
                          <span className="legend-value">{formatCurrency(item.sales)} ({percentage}%)</span>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <p className="muted">No category data available.</p>
              )}
            </div>
          </div>

          <div className="report-grid">
            <div className="report-card chart-wide">
              <div className="card-title">Sales Trend Over Time</div>
              {dailyTrend.length ? (
                <div className="chart-container">{renderLineChartSVG(dailyTrend)}</div>
              ) : (
                <p className="muted">No data for the selected range.</p>
              )}
            </div>

            <div className="report-card chart-wide">
              <div className="card-title">Peak Hours Analysis</div>
              {peakHours.some((h) => h.orders > 0) ? (
                <div className="chart-container">{renderHeatmapSVG(peakHours)}</div>
              ) : (
                <p className="muted">No hourly data available.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Report