function ScoreRing({ value, size = 'small' }) {
  return (
    <div className={`score-ring ${size}`} style={{ '--score': `${value}%` }}>
      <span>{value}%</span>
    </div>
  )
}

export default ScoreRing
