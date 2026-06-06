import Logo from './Logo'

function Sidebar({ items, screen, navigate, role, open }) {
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <Logo />
      <span className="sidebar-role">{role} Workspace</span>
      <div className="sidebar-links">
        {items.map(([id, Icon, label]) => (
          <button className={screen === id ? 'active' : ''} key={id} onClick={() => navigate(id)}>
            <Icon size={19} />
            {label}
          </button>
        ))}
      </div>
    </aside>
  )
}

export default Sidebar
