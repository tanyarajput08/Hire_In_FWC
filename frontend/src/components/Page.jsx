function Page({ title, subtitle, children }) {
  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

export default Page
