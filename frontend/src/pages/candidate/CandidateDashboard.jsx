import { ChevronRight, ClipboardCheck, FileText, Gauge, Star, UploadCloud } from 'lucide-react'
import DataTable from '../../components/DataTable'
import Page from '../../components/Page'
import Panel from '../../components/Panel'
import StatsGrid from '../../components/StatsGrid'
import StatusPill from '../../components/StatusPill'

function CandidateDashboard({ navigate, applications = [] }) {
  const scores = applications.map((row) => Number(row.score || 0)).filter(Boolean)
  const averageScore = scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : 0
  const highestScore = scores.length ? Math.max(...scores) : 0
  const hasResume = applications.some((row) => row.resume_id)

  return (
    <Page title="Candidate Dashboard" subtitle="Track applications, match scores, and next hiring steps.">
      <StatsGrid
        stats={[
          ['Applications Submitted', String(applications.length), ClipboardCheck],
          ['Average Match Score', `${averageScore}%`, Gauge],
          ['Highest Score', `${highestScore}%`, Star],
          ['Resume Status', hasResume ? 'Uploaded' : 'Pending', FileText],
        ]}
      />
      <div className="two-column">
        <Panel title="Recent Applications">
          <DataTable
            columns={['Job', 'Status', 'Score']}
            rows={applications.map((row) => [
              row.job_title,
              <StatusPill label={row.status} />,
              row.score ? `${row.score}%` : 'Not screened',
            ])}
          />
          {!applications.length && <p>No applications yet. Browse jobs and apply with a resume.</p>}
        </Panel>
        <Panel title="Quick Actions">
          <div className="dashboard-actions">
            <button className="secondary-button wide" onClick={() => navigate('jobs')}>
              Browse Jobs <ChevronRight size={17} />
            </button>
            <button className="primary-button wide" onClick={() => navigate('update-resume')}>
              Update Resume <UploadCloud size={18} />
            </button>
          </div>
        </Panel>
      </div>
    </Page>
  )
}

export default CandidateDashboard
