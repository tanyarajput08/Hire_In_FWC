import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react'
import ChartBox from '../../components/ChartBox'
import Page from '../../components/Page'
import Panel from '../../components/Panel'
import { tooltipStyle } from '../../utils/chartTheme'

function AnalyticsPage({ jobs = [], applicants = [] }) {
  const totalApplicants = applicants.length
  const screenedApplicants = applicants.filter((a) => Number(a.score || 0) > 0)
  
  const averageScore = screenedApplicants.length
    ? Math.round(screenedApplicants.reduce((sum, a) => sum + Number(a.score), 0) / screenedApplicants.length)
    : 0
    
  const selectedApplicants = applicants.filter((a) => a.status === 'SELECTED')
  
  const selectionRate = totalApplicants
    ? Math.round((selectedApplicants.length / totalApplicants) * 100)
    : 0

  const skillCounts = {}
  applicants.forEach((candidate) => {
    const skills = candidate.matched_skills || []
    skills.forEach((skill) => {
      const name = skill.trim()
      if (!name) return
      skillCounts[name] = (skillCounts[name] || 0) + 1
    })
  })
  
  const skillData = Object.entries(skillCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const topSkill = skillData[0]?.name || 'N/A'

  const scoreBuckets = [
    { range: '0-20', count: 0 },
    { range: '21-40', count: 0 },
    { range: '41-60', count: 0 },
    { range: '61-80', count: 0 },
    { range: '81-100', count: 0 },
  ]
  screenedApplicants.forEach((candidate) => {
    const val = Number(candidate.score || 0)
    if (val <= 20) scoreBuckets[0].count++
    else if (val <= 40) scoreBuckets[1].count++
    else if (val <= 60) scoreBuckets[2].count++
    else if (val <= 80) scoreBuckets[3].count++
    else scoreBuckets[4].count++
  })

  const jobVolumeData = jobs.map((job) => ({
    name: job.title.length > 15 ? `${job.title.substring(0, 15)}...` : job.title,
    applications: applicants.filter((a) => a.job_id === job.id).length,
  }))

  const funnelData = [
    { stage: 'Applied', count: totalApplicants },
    { stage: 'Screened', count: screenedApplicants.length },
    { stage: 'Shortlisted', count: applicants.filter((a) => ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED'].includes(a.status)).length },
    { stage: 'Interviewed', count: applicants.filter((a) => ['INTERVIEW_SCHEDULED', 'SELECTED'].includes(a.status)).length },
    { stage: 'Selected', count: selectedApplicants.length },
  ]

  const missingSkillCounts = {}
  applicants.forEach((candidate) => {
    const missing = candidate.missing_skills || []
    missing.forEach((skill) => {
      const name = skill.trim()
      if (!name) return
      missingSkillCounts[name] = (missingSkillCounts[name] || 0) + 1
    })
  })
  
  const sortedGaps = Object.entries(missingSkillCounts)
    .map(([name, count]) => ({
      name,
      percentage: totalApplicants ? Math.round((count / totalApplicants) * 100) : 0
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3)

  const aiInsights = []
  if (sortedGaps.length > 0) {
    aiInsights.push({
      type: 'gap',
      icon: AlertTriangle,
      color: '#f87171',
      title: 'Major Sourcing Skill Gaps Detected',
      desc: `${sortedGaps[0].percentage}% of your candidates lack "${sortedGaps[0].name}" experience. Consider updating job postings to highlight this requirement or target alternative profiles.`
    })
  }
  if (totalApplicants > 0 && averageScore < 70) {
    aiInsights.push({
      type: 'sourcing',
      icon: Lightbulb,
      color: '#fbbf24',
      title: 'Talent Alignment Recommendation',
      desc: `Your average candidate match score is ${averageScore}%. Expand screening parameters or consider broadening search criteria for adjacent skills to attract stronger fits.`
    })
  } else if (totalApplicants > 0) {
    aiInsights.push({
      type: 'sourcing',
      icon: TrendingUp,
      color: '#34d399',
      title: 'Strong Candidate Pipeline',
      desc: `Your overall candidate fit is high. Top skill match: "${topSkill}". Proceed with scheduling structured video interviews for candidates scoring above 80% to expedite hiring.`
    })
  } else {
    aiInsights.push({
      type: 'sourcing',
      icon: Sparkles,
      color: '#60a5fa',
      title: 'TalentIQ Pipeline Recommendation',
      desc: 'No applicant data available yet. Sourced candidate profiles will dynamically compile real-time skill alignment and talent gaps.'
    })
  }

  return (
    <Page title="Talent Analytics" subtitle="Hiring health, skill distribution, and candidate alignment metrics.">
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <Panel className="stat-card" style={{ padding: '20px' }}>
          <span className="muted" style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Applicants</span>
          <strong style={{ fontSize: '32px', color: '#fff', display: 'block', marginTop: '6px' }}>{totalApplicants}</strong>
        </Panel>
        <Panel className="stat-card" style={{ padding: '20px' }}>
          <span className="muted" style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Average Match Score</span>
          <strong style={{ fontSize: '32px', color: '#3b82f6', display: 'block', marginTop: '6px' }}>{averageScore}%</strong>
        </Panel>
        <Panel className="stat-card" style={{ padding: '20px' }}>
          <span className="muted" style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Sourced Skill</span>
          <strong style={{ fontSize: '32px', color: '#10b981', display: 'block', marginTop: '6px' }}>{topSkill}</strong>
        </Panel>
        <Panel className="stat-card" style={{ padding: '20px' }}>
          <span className="muted" style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Selection Rate</span>
          <strong style={{ fontSize: '32px', color: '#ff7b00', display: 'block', marginTop: '6px' }}>{selectionRate}%</strong>
        </Panel>
      </div>

      <div className="two-column" style={{ marginBottom: '24px' }}>
        <Panel title="Most Common Matched Candidate Skills">
          <ChartBox>
            {skillData.length > 0 ? (
              <BarChart data={skillData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263247" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={80} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            ) : (
              <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
                Screen applicants to parse resume skills and populate this chart.
              </div>
            )}
          </ChartBox>
        </Panel>

        <Panel title="Recruitment Funnel Conversion">
          <ChartBox>
            <BarChart data={funnelData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#263247" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey="stage" type="category" stroke="#94a3b8" width={80} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ChartBox>
        </Panel>
      </div>

      <div className="two-column" style={{ marginBottom: '24px' }}>
        <Panel title="Screening Match Score Distribution">
          <ChartBox>
            {screenedApplicants.length > 0 ? (
              <BarChart data={scoreBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263247" />
                <XAxis dataKey="range" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#ff7b00" radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            ) : (
              <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
                Screen applicants to generate score distribution metrics.
              </div>
            )}
          </ChartBox>
        </Panel>

        <Panel title="Application Volumes By Job">
          <ChartBox>
            {jobVolumeData.length > 0 ? (
              <BarChart data={jobVolumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263247" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="applications" fill="#60a5fa" radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            ) : (
              <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
                No jobs configured.
              </div>
            )}
          </ChartBox>
        </Panel>
      </div>

      <Panel title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} style={{ color: '#ff9e3b' }} />
          <span>TalentIQ Recruiter AI Sourcing Insights</span>
        </div>
      }>
        <div style={{ display: 'grid', gap: '16px', marginTop: '12px' }}>
          {aiInsights.map((insight, idx) => {
            const Icon = insight.icon
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.01)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-glass)',
                  alignItems: 'start'
                }}
              >
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    display: 'grid',
                    placeItems: 'center'
                  }}
                >
                  <Icon size={20} style={{ color: insight.color }} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '15px', fontWeight: 800 }}>
                    {insight.title}
                  </h4>
                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13px', lineHeight: '1.5' }}>
                    {insight.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </Panel>
    </Page>
  )
}

export default AnalyticsPage
