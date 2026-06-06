import { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import CandidateAnalysis from '../../components/CandidateAnalysis'
import Page from '../../components/Page'
import Panel from '../../components/Panel'
import ResumePreview from '../../components/ResumePreview'
import StatusPill from '../../components/StatusPill'
import ScoreRing from '../../components/ScoreRing'
import { applicationStatuses } from '../../constants/applicationStatuses'
import { api } from '../../services/api'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

function CandidateDetailPage({ candidate, allCandidates = [], status, updateStatus }) {
  const [tab, setTab] = useState('Overview')
  const [showDrawer, setShowDrawer] = useState(false)
  
  const [justification, setJustification] = useState(null)
  const [loadingJustification, setLoadingJustification] = useState(false)
  const [justificationError, setJustificationError] = useState('')

  const [compareCandidateId, setCompareCandidateId] = useState('')
  const [comparison, setComparison] = useState(null)
  const [loadingComparison, setLoadingComparison] = useState(false)
  const [comparisonError, setComparisonError] = useState('')

  const [previewUrl, setPreviewUrl] = useState('')
  const [loadingPreview, setLoadingPreview] = useState(false)

  const [interviewResult, setInterviewResult] = useState(null)
  const [loadingInterview, setLoadingInterview] = useState(false)
  const [interviewError, setInterviewError] = useState('')

  const applicationId = candidate?.application_id || candidate?.id

  useEffect(() => {
    if (!candidate?.resume_id || !applicationId) {
      setPreviewUrl('')
      return
    }
    let active = true
    let blobUrl = ''
    async function loadPreview() {
      setLoadingPreview(true)
      try {
        const url = await api.getResumePreviewUrl(applicationId)
        if (active) {
          blobUrl = url
          setPreviewUrl(url)
        }
      } catch (err) {
        console.error('Failed to load resume preview', err)
      } finally {
        if (active) setLoadingPreview(false)
      }
    }
    loadPreview()
    return () => {
      active = false
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
      }
    }
  }, [candidate?.resume_id, applicationId])

  useEffect(() => {
    if (tab !== 'Interview' || !applicationId) return

    async function fetchInterview() {
      setLoadingInterview(true)
      setInterviewError('')
      setInterviewResult(null)
      try {
        const response = await api.getInterviewResult(applicationId)
        setInterviewResult(response)
      } catch (err) {
        setInterviewError(err.message || 'No interview result found for this candidate.')
      } finally {
        setLoadingInterview(false)
      }
    }
    fetchInterview()
  }, [tab, applicationId])

  useEffect(() => {
    if (!showDrawer || !applicationId) return

    async function fetchJustification() {
      setLoadingJustification(true)
      setJustificationError('')
      try {
        const response = await api.getScoreJustification(applicationId)
        setJustification(response)
      } catch (err) {
        setJustificationError(err.message || 'Failed to fetch score justification.')
      } finally {
        setLoadingJustification(false)
      }
    }
    fetchJustification()
  }, [showDrawer, applicationId])

  useEffect(() => {
    if (!compareCandidateId || !applicationId) {
      return
    }

    async function fetchComparison() {
      setLoadingComparison(true)
      setComparisonError('')
      try {
        const response = await api.compareCandidates(applicationId, compareCandidateId)
        setComparison(response)
      } catch (err) {
        setComparisonError(err.message || 'Failed to compare candidates.')
      } finally {
        setLoadingComparison(false)
      }
    }
    fetchComparison()
  }, [compareCandidateId, applicationId])

  if (!candidate) {
    return (
      <Page title="Candidate" subtitle="No real candidate selected yet.">
        <Panel title="No Applicant">
          <p>Apply with a real candidate account or open an applicant from a job to view details.</p>
        </Panel>
      </Page>
    )
  }

  const name = candidate.candidate_name || candidate.name || 'Candidate'
  const score = Number(candidate.score || 0)
  const matchedSkills = Array.isArray(candidate.matched_skills) ? candidate.matched_skills : []
  const missingSkills = Array.isArray(candidate.missing_skills) ? candidate.missing_skills : []

  const summaryObj = typeof candidate.summary === 'string'
    ? (() => {
        try {
          return JSON.parse(candidate.summary)
        } catch {
          return null
        }
      })()
    : (candidate.summary || null)

  const expYears = summaryObj?.experience_years ?? null
  const breakdown = summaryObj?.score_breakdown ?? null
  const breakdownData = breakdown ? [
    { name: 'Semantic Alignment', value: breakdown.semantic_alignment || 0, color: '#60a5fa' },
    { name: 'Skill Coverage', value: breakdown.skill_coverage || 0, color: '#34d399' },
    { name: 'Experience Fit', value: breakdown.experience_fit || 0, color: '#fb923c' },
  ] : []

  const normalizedCandidate = {
    ...candidate,
    name,
    score,
    recommendation: summaryObj?.interview_recommendation || (score >= 80 ? 'Proceed to interview' : score >= 60 ? 'Review manually' : 'Not recommended yet'),
    matched: matchedSkills,
    missing: missingSkills,
    strengths: summaryObj?.strengths || candidate.job_description || 'Screen this candidate to generate AI strengths.',
    weakness: summaryObj?.weaknesses || (missingSkills.length ? `Missing required skills: ${missingSkills.join(', ')}` : 'No required skills are missing from the parsed evidence.'),
    skills: String(candidate.skills_required || '').split(',').map((skill) => {
      const cleanSkill = skill.trim()
      const isMatched = matchedSkills.some(
        (s) => s.toLowerCase().includes(cleanSkill.toLowerCase()) || cleanSkill.toLowerCase().includes(s.toLowerCase())
      )
      return {
        name: cleanSkill,
        matched: isMatched,
        value: isMatched ? 100 : 0,
      }
    }).filter((skill) => skill.name),
    resume: candidate.resume_file_path || 'No resume uploaded',
  }

  const otherCandidates = (allCandidates || []).filter(
    (cand) => {
      const candId = cand.application_id || cand.id
      return candId !== applicationId && Number(cand.score || 0) > 0
    }
  )

  return (
    <Page title={name} subtitle="Candidate profile, resume preview, and AI analysis.">
      <div className="tabs">
        {['Overview', 'Resume', 'AI Analysis', 'Interview'].map((item) => (
          <button className={tab === item ? 'active' : ''} onClick={() => setTab(item)} key={item}>
            {item}
          </button>
        ))}
      </div>
      {tab === 'Overview' && (
        <div className="two-column align-start">
          <Panel
            title="Screening Summary"
            action={
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {score > 0 && (
                  <button
                    className="secondary-button compact"
                    onClick={() => setShowDrawer(true)}
                    style={{
                      background: 'var(--accent-grad)',
                      color: '#fff',
                      border: '0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 800,
                    }}
                  >
                    <Sparkles size={14} /> Explain Score & Compare
                  </button>
                )}
                <StatusPill label={status} />
              </div>
            }
          >
            <CandidateAnalysis candidate={normalizedCandidate} />
          </Panel>
          <div style={{ display: 'grid', gap: '20px', width: '100%' }}>
            <Panel title="Decision">
              <div className="decision-actions">
                {applicationStatuses.map((item) => (
                  <button
                    className={status === item ? 'primary-button wide' : 'secondary-button wide'}
                    onClick={() => updateStatus(item)}
                    key={item}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="Score Breakdown">
              {breakdown ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '100%', height: '180px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={breakdownData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {breakdownData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'grid', gap: '10px', width: '100%', fontSize: '13px' }}>
                    {breakdownData.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
                          {item.name}
                        </span>
                        <strong>{item.value}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="muted" style={{ fontSize: '13px' }}>No screening breakdown details available.</p>
              )}
              {expYears !== null && (
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-glass)' }}>
                  <span className="muted" style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Extracted Experience</span>
                  <strong style={{ fontSize: '20px', color: '#fb923c' }}>{expYears} Years</strong>
                </div>
              )}
            </Panel>
          </div>
        </div>
      )}
      {tab === 'Resume' && (
        loadingPreview ? (
          <Panel title="Resume Preview">
            <p className="muted">Fetching secure resume preview...</p>
          </Panel>
        ) : (
          <ResumePreview
            candidate={normalizedCandidate}
            previewUrl={previewUrl}
          />
        )
      )}
      {tab === 'AI Analysis' && <CandidateAnalysis candidate={normalizedCandidate} />}
      {tab === 'Interview' && (
        loadingInterview ? (
          <Panel title="Interview Analysis">
            <p className="muted">Loading interview results...</p>
          </Panel>
        ) : interviewError || !interviewResult ? (
          <Panel title="Interview Analysis">
            <p className="muted">No interview analysis has been run for this candidate yet. Go to the Interviews dashboard to analyze a recording or transcript.</p>
          </Panel>
        ) : (
          <Panel title="Interview Analysis Results">
            <div className="interview-score-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div className="score-metric" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <ScoreRing value={interviewResult.communication_score} />
                <span style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600 }}>Communication</span>
              </div>
              <div className="score-metric" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <ScoreRing value={interviewResult.technical_relevance_score} />
                <span style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600 }}>Technical Relevance</span>
              </div>
              <div className="score-metric" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <ScoreRing value={interviewResult.confidence_score} />
                <span style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600 }}>Confidence</span>
              </div>
              <div className="score-metric" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <ScoreRing value={interviewResult.overall_score} />
                <span style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600 }}>Overall</span>
              </div>
            </div>
            <div className="ai-summary" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-glass)', marginBottom: '20px' }}>
              <h3 style={{ color: '#60a5fa', margin: '0 0 10px 0' }}>AI Interview Feedback</h3>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#cbd5e1' }}>{interviewResult.feedback}</p>
            </div>
            {interviewResult.transcript && (
              <div className="ai-summary" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                <h3 style={{ color: '#cbd5e1', margin: '0 0 10px 0' }}>Candidate Transcript</h3>
                <p style={{ fontStyle: 'italic', color: '#a0a0a0', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  "{interviewResult.transcript}"
                </p>
              </div>
            )}
          </Panel>
        )
      )}

      {showDrawer && (
        <div className="drawer-overlay" onClick={() => setShowDrawer(false)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2>AI Score Explainer</h2>
              <button className="close-btn" onClick={() => setShowDrawer(false)}>&times;</button>
            </div>
            <div className="drawer-body">
              <div className="drawer-section">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff9e3b' }}>
                  <Sparkles size={16} /> Score Justification
                </h3>
                {loadingJustification ? (
                  <p className="muted">Generating score explanation via AI...</p>
                ) : justificationError ? (
                  <p className="error" style={{ color: '#fecaca' }}>{justificationError}</p>
                ) : (
                  <div className="justification-text">
                    <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap', color: '#e2e8f0' }}>
                      {justification?.reasoning}
                    </p>
                    
                    <h4 style={{ marginTop: '20px', color: '#ff7b00', fontSize: '15px' }}>Improvement Suggestions:</h4>
                    <ul style={{ paddingLeft: '20px', lineHeight: '1.6', color: '#cbd5e1' }}>
                      {justification?.recommendations?.map((rec, i) => (
                        <li key={i} style={{ marginBottom: '8px' }}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="drawer-section" style={{ borderTop: '1px solid var(--border-glass)', marginTop: '20px', paddingTop: '20px' }}>
                <h3 style={{ color: '#60a5fa' }}>Compare with another Applicant</h3>
                <p className="muted" style={{ fontSize: '13px', marginBottom: '12px', color: '#a0a0a0' }}>
                  Select another screened candidate to explain score differences side-by-side.
                </p>
                <div className="field" style={{ marginTop: '0', marginBottom: '16px' }}>
                  <select
                    value={compareCandidateId}
                    onChange={(e) => {
                      setCompareCandidateId(e.target.value)
                      if (!e.target.value) setComparison(null)
                    }}
                    style={{
                      background: '#111827',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#fff',
                      width: '100%',
                      font: 'inherit',
                      outline: 'none',
                    }}
                  >
                    <option value="">Choose candidate...</option>
                    {otherCandidates.map((cand) => {
                      const candId = cand.application_id || cand.id
                      return (
                        <option key={candId} value={candId}>
                          {cand.candidate_name || cand.name} (Score: {Math.round(Number(cand.score)) || 0}%)
                        </option>
                      )
                    })}
                  </select>
                </div>

                {compareCandidateId && (
                  loadingComparison ? (
                    <p className="muted">Analyzing and comparing candidates via AI...</p>
                  ) : comparisonError ? (
                    <p className="error" style={{ color: '#fecaca' }}>{comparisonError}</p>
                  ) : (
                    <div
                      className="comparison-result"
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-glass)',
                        lineHeight: '1.5',
                      }}
                    >
                      <h4 style={{ margin: '0 0 8px 0', color: '#60a5fa', fontSize: '14px' }}>AI Match Verdict:</h4>
                      <p style={{ fontStyle: 'italic', marginBottom: '14px', fontSize: '13px', color: '#93c5fd' }}>
                        "{comparison?.verdict}"
                      </p>
                      
                      <h4 style={{ margin: '14px 0 6px 0', color: '#f1f5f9', fontSize: '14px' }}>Summary:</h4>
                      <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '14px' }}>
                        {comparison?.comparison_summary}
                      </p>
                      
                      <h4 style={{ margin: '14px 0 6px 0', color: '#f1f5f9', fontSize: '14px' }}>Key Differences:</h4>
                      <ul style={{ paddingLeft: '20px', fontSize: '13px', color: '#cbd5e1', margin: '0' }}>
                        {comparison?.key_differences?.map((diff, idx) => (
                          <li key={idx} style={{ marginBottom: '6px' }}>{diff}</li>
                        ))}
                      </ul>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Page>
  )
}

export default CandidateDetailPage
