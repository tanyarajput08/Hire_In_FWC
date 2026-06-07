import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import { BriefcaseBusiness, ChevronRight, FileSearch, Star, Users } from 'lucide-react'
import ChartBox from '../../components/ChartBox'
import Page from '../../components/Page'
import Panel from '../../components/Panel'
import StatsGrid from '../../components/StatsGrid'
import { tooltipStyle } from '../../utils/chartTheme'
import { ROUTES } from '../../routes'

function HrDashboard({ navigate, jobs = [], applicants = [] }) {
  const screenedCount = applicants.filter((candidate) => Number(candidate.score || 0) > 0).length
  const topScore = applicants.reduce((best, candidate) => Math.max(best, Number(candidate.score || 0)), 0)
  const chartJobs = jobs.map((job) => ({
    ...job,
    applications: applicants.filter((candidate) => candidate.job_id === job.id).length,
  }))
  const funnel = [
    ['Applied', applicants.length],
    ['Screened', applicants.filter((candidate) => candidate.status === 'SCREENED').length],
    ['Shortlisted', applicants.filter((candidate) => candidate.status === 'SHORTLISTED').length],
    ['Interview', applicants.filter((candidate) => candidate.status === 'INTERVIEW_SCHEDULED').length],
  ]

  return (
    <Page title="HR Dashboard" subtitle="Your hiring pipeline at a glance.">
      <StatsGrid
        stats={[
          ['Total Jobs', String(jobs.length), BriefcaseBusiness],
          ['Applications', String(applicants.length), Users],
          ['Screened Candidates', String(screenedCount), FileSearch],
          ['Top Score', topScore ? `${topScore}%` : '0%', Star],
        ]}
      />
      <div className="two-column">
        <Panel title="Applications Per Job">
          <ChartBox>
            <BarChart data={chartJobs}>
              <CartesianGrid strokeDasharray="3 3" stroke="#263247" />
              <XAxis dataKey="title" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="applications" radius={[8, 8, 0, 0]} fill="#3b82f6" />
            </BarChart>
          </ChartBox>
        </Panel>
        <Panel title="Candidate Funnel">
          <div className="funnel-list">
            {funnel.map(([stage, value], index) => (
              <div className="funnel-step" key={stage}>
                <span>{stage}</span>
                <strong>{value}</strong>
                {index < funnel.length - 1 && <ChevronRight size={18} />}
              </div>
            ))}
          </div>
          <button className="secondary-button" onClick={() => navigate(ROUTES.HR_RANKINGS)}>
            View Rankings <ChevronRight size={17} />
          </button>
        </Panel>
      </div>
    </Page>
  )
}

export default HrDashboard
