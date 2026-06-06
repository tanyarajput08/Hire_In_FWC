import { Check, X } from 'lucide-react'

function SkillColumn({ title, items, type }) {
  const visibleItems = Array.isArray(items) ? items.filter(Boolean) : []

  return (
    <div className="skill-column">
      <h3>{title}</h3>
      {visibleItems.length === 0 && (
        <span className="muted">No {type === 'match' ? 'matched' : 'missing'} skills recorded.</span>
      )}
      {visibleItems.map((item) => (
        <span key={item} className={type}>
          {type === 'match' ? <Check size={16} /> : <X size={16} />} {item}
        </span>
      ))}
    </div>
  )
}

export default SkillColumn
