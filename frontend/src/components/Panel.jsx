function Panel({ title, action, children, flat = false }) {
  return (
    <section className={flat ? 'panel flat' : 'panel'}>
      <div className="panel-title">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export default Panel
