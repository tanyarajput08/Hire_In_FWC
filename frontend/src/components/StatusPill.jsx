function StatusPill({ label }) {
  const normalized = label?.toLowerCase() || ''
  const tone = normalized.includes('short') || normalized.includes('screen')
    ? 'good'
    : normalized.includes('reject')
      ? 'bad'
      : ''

  return <span className={`status-pill ${tone}`}>{label}</span>
}

export default StatusPill
