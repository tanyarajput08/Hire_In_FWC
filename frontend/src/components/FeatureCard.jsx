function FeatureCard({ icon: Icon, title, text }) {
  return (
    <div className="feature-card">
      <Icon size={24} />
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  )
}

export default FeatureCard
