const STATUS_LABELS = {
  menunggu: 'Menunggu',
  proses: 'Dalam proses',
  menunggu_validasi: 'Menunggu validasi',
  revisi: 'Perlu revisi',
  selesai: 'Selesai',
}

const STATUS_COLORS = {
  menunggu: '#66809a',
  proses: '#1e5be7',
  menunggu_validasi: '#b76e00',
  revisi: '#c8372d',
  selesai: '#1a8a5a',
}

const formatDate = (value) => {
  const date = new Date(`${value}T00:00:00`)
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(date)
}

function DailyTrend({ data, loading }) {
  const width = 720
  const height = 250
  const plot = { left: 44, right: 12, top: 16, bottom: 34 }
  const chartWidth = width - plot.left - plot.right
  const chartHeight = height - plot.top - plot.bottom
  const maxValue = Math.max(1, ...data.map((item) => Number(item.total) || 0))
  const tickStep = Math.max(1, Math.ceil(maxValue / 4))
  const ticks = Array.from({ length: 5 }, (_, index) => tickStep * (4 - index))
  const points = data.map((item, index) => {
    const x = plot.left + (data.length < 2 ? chartWidth / 2 : (index / (data.length - 1)) * chartWidth)
    const value = Number(item.total) || 0
    const y = plot.top + chartHeight - (value / (tickStep * 4)) * chartHeight
    return { x, y, value, day: item.day }
  })
  const hasActivity = points.some((point) => point.value > 0)
  const line = points.map((point) => `${point.x},${point.y}`).join(' ')
  const labelIndexes = new Set([0, 3, 6, 9, 13].filter((index) => index < points.length))

  return (
    <section className="analytics-panel analytics-trend">
      <header className="analytics-panel-header">
        <div>
          <h3>Volume Pemeriksaan</h3>
          <p>Jumlah pemeriksaan per hari</p>
        </div>
        <span className="analytics-range">14 hari terakhir</span>
      </header>
      {loading ? (
        <div className="analytics-chart-state">Memuat data...</div>
      ) : !hasActivity ? (
        <div className="analytics-chart-state">Belum ada pemeriksaan dalam 14 hari terakhir.</div>
      ) : (
        <div className="analytics-chart-scroll">
          <svg
            className="analytics-line-chart"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Grafik jumlah pemeriksaan harian selama 14 hari terakhir"
          >
            {ticks.map((tick, index) => {
              const y = plot.top + (index / 4) * chartHeight
              return (
                <g key={tick}>
                  <line x1={plot.left} x2={width - plot.right} y1={y} y2={y} className="analytics-grid-line" />
                  <text x={plot.left - 10} y={y + 4} textAnchor="end" className="analytics-axis-label">{tick}</text>
                </g>
              )
            })}
            <polyline points={line} className="analytics-trend-line" />
            {points.map((point) => (
              <circle key={point.day} cx={point.x} cy={point.y} r="3.5" className="analytics-trend-point">
                <title>{`${formatDate(point.day)}: ${point.value} pemeriksaan`}</title>
              </circle>
            ))}
            {points.map((point, index) => labelIndexes.has(index) && (
              <text key={point.day} x={point.x} y={height - 8} textAnchor="middle" className="analytics-axis-label">
                {formatDate(point.day)}
              </text>
            ))}
          </svg>
        </div>
      )}
    </section>
  )
}

function BreakdownPanel({ title, subtitle, items, loading, kind }) {
  const maxValue = Math.max(1, ...items.map((item) => Number(item.total) || 0))
  const isEmpty = items.length === 0 || items.every((item) => Number(item.total) === 0)

  return (
    <section className="analytics-panel analytics-breakdown">
      <header className="analytics-panel-header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </header>
      {loading ? (
        <div className="analytics-breakdown-state">Memuat data...</div>
      ) : isEmpty ? (
        <div className="analytics-breakdown-state">Belum ada data untuk ditampilkan.</div>
      ) : (
        <ul className={`analytics-bars ${kind}`}>
          {items.map((item) => {
            const value = Number(item.total) || 0
            const label = kind === 'status' ? (STATUS_LABELS[item.status] || item.status) : item.label
            const color = kind === 'status' ? STATUS_COLORS[item.status] || STATUS_COLORS.menunggu : '#1e5be7'

            return (
              <li key={item.status || item.label} className="analytics-bar-row">
                <div className="analytics-bar-label">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
                <div className="analytics-bar-track" aria-hidden="true">
                  <span style={{ width: `${(value / maxValue) * 100}%`, backgroundColor: color }} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function AdminAnalytics({ data, loading, error }) {
  return (
    <div className="admin-analytics">
      {error && <p className="analytics-error" role="alert">{error}</p>}
      <DailyTrend data={data?.daily || []} loading={loading} />
      <div className="analytics-breakdown-grid">
        <BreakdownPanel
          title="Pemeriksaan per Status"
          subtitle="Seluruh pemeriksaan"
          items={data?.statuses || []}
          loading={loading}
          kind="status"
        />
        <BreakdownPanel
          title="Kategori Tes"
          subtitle="30 hari terakhir"
          items={data?.categories || []}
          loading={loading}
          kind="category"
        />
      </div>
    </div>
  )
}

export default AdminAnalytics