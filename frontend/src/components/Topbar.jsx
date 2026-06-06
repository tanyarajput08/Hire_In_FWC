import { LogOut, Menu } from 'lucide-react'

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'U'

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function Topbar({ role, user, onMenu, onLogout, jobs = [], activeJobId, onChangeJob, showActiveJob = true }) {
  const roleLabel = role === 'HR' ? 'HR Lead' : 'Candidate'
  const displayName = user?.name || user?.email || roleLabel
  const initials = getInitials(user?.name || user?.email || roleLabel)

  return (
    <header className="topbar">
      <button className="icon-button menu-button" onClick={onMenu} aria-label="Open sidebar">
        <Menu size={20} />
      </button>
      <div className="topbar-context">
        <div>
          <span className="topbar-kicker">Logged in as</span>
          <strong>{displayName}, {roleLabel}</strong>
        </div>
        
        {role === 'HR' && showActiveJob && jobs.length > 0 && (
          <div className="active-job-control">
            <span className="muted">Active Job:</span>
            <select
              value={activeJobId}
              onChange={(e) => onChangeJob(Number(e.target.value))}
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="topbar-actions">
        <span className="avatar">{initials}</span>
        <button className="icon-button" onClick={onLogout} aria-label="Logout">
          <LogOut size={19} />
        </button>
      </div>
    </header>
  )
}

export default Topbar
