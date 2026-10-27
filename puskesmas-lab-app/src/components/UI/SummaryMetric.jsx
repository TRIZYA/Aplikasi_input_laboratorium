function SummaryMetric({ icon: Icon, label, value, tone }) {
  return (
    <article className={`summary-card ${tone}`}>
      <span className="summary-card-icon" aria-hidden="true"><Icon /></span>
      <span className="summary-card-label">{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

export default SummaryMetric