import Page from '../../components/Page'
import Panel from '../../components/Panel'

function ProfilePage({ user, applications = [] }) {
  const name = user?.name || 'Candidate'
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'C'
  const uploadedResumeCount = applications.filter((application) => application.resume_id).length
  const appliedJobTitles = applications.map((application) => application.job_title).filter(Boolean)

  return (
    <Page title="Profile" subtitle="Candidate resume and contact profile.">
      <Panel title={name}>
        <div className="profile-card">
          <span className="avatar large">{initials}</span>
          <div>
            <h3>{name}</h3>
            <p>{user?.email || 'No email available for this account.'}</p>
            <div className="chip-row">
              <span className="chip">{uploadedResumeCount} resume uploads</span>
              <span className="chip">{applications.length} applications</span>
              {appliedJobTitles.slice(0, 3).map((title) => (
                <span className="chip" key={title}>{title}</span>
              ))}
            </div>
          </div>
        </div>
      </Panel>
    </Page>
  )
}

export default ProfilePage
