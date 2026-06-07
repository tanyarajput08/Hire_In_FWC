import { Check, Search, UploadCloud } from 'lucide-react'
import Page from '../../components/Page'
import Panel from '../../components/Panel'
import { formatApplicationCloseAt, isApplicationOpen } from '../../utils/applicationDeadline'
import { parseSkillsRequired } from '../../utils/skillMatching'

function JobsPage({ jobs, appliedJobIds = [], query, setQuery, filter, setFilter, onApply }) {
  return (
    <Page title="Browse Jobs" subtitle="Search openings and apply with your resume.">
      <div className="toolbar">
        <label className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search jobs..." />
        </label>
        <div className="segmented">
          {['All', 'Remote', 'Full-Time', 'Internship'].map((item) => (
            <button className={filter === item ? 'active' : ''} onClick={() => setFilter(item)} key={item}>
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="job-grid">
        {jobs.map((job) => {
          const applied = appliedJobIds.includes(job.id)
          const open = isApplicationOpen(job.application_close_at)
          const closeLabel = formatApplicationCloseAt(job.application_close_at)

          return (
            <Panel
              key={job.id}
              title={job.title}
              action={
                applied
                  ? <span className="status-pill success">Applied</span>
                  : <span className="status-pill">{open ? 'Open' : 'Closed'}</span>
              }
            >
              <p>{job.description}</p>
              <div className="chip-row">
                {job.type && <span className="chip">{job.type}</span>}
                {job.mode && <span className="chip">{job.mode}</span>}
                {parseSkillsRequired(job.skills_required).map((skill) => (
                  <span className="chip" key={skill}>{skill}</span>
                ))}
              </div>
              <div className="job-meta">
                <span>{closeLabel ? (open ? `Apply by ${closeLabel}` : `Closed ${closeLabel}`) : 'Open role'}</span>
                <span>#{job.id}</span>
              </div>
              {applied ? (
                <button className="secondary-button wide" disabled>
                  <Check size={18} /> Applied
                </button>
              ) : (
                <button className="primary-button wide" onClick={() => onApply(job.id)} disabled={!open}>
                  {open ? <>Apply <UploadCloud size={18} /></> : 'Applications Closed'}
                </button>
              )}
            </Panel>
          )
        })}
      </div>
      {!jobs.length && <Panel title="No Jobs"><p>No jobs are available yet. Ask HR to create one.</p></Panel>}
    </Page>
  )
}

export default JobsPage
