function StatsGrid({ stats }) {
  return (
    <div className="stats-grid">
      {stats.map(([label, value, Icon]) => (
        <div className="stat-card" key={label}>
          <Icon size={22} />
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  )
}

export default StatsGrid
