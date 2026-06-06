import { ArrowLeft, UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'
import CandidateAnalysis from '../../components/CandidateAnalysis'
import Page from '../../components/Page'
import Panel from '../../components/Panel'
import { api } from '../../services/api'
import { formatApplicationCloseAt, isApplicationOpen } from '../../utils/applicationDeadline'
import { isSkillMatched } from '../../utils/skillMatching'

function parseSummary(summary) {
  if (!summary) return null
  if (typeof summary === 'object') return summary

  try {
    return JSON.parse(summary)
  } catch {
    return null
  }
}

function ApplicationDetail({ candidate, onBack, onDeleteResume, onResumeUpdated }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  if (!candidate) {
    return (
      <Page title="Application Details" subtitle="No real application selected yet.">
        <Panel title="No Application">
          <p>Apply to a real job with a resume, then open the application to view AI results.</p>
        </Panel>
      </Page>
    )
  }

  const canModifyResume = isApplicationOpen(candidate.application_close_at)
  const closeLabel = formatApplicationCloseAt(candidate.application_close_at)
  const score = Number(candidate.score || 0)
  const matchedSkills = Array.isArray(candidate.matched_skills) ? candidate.matched_skills : []
  const missingSkills = Array.isArray(candidate.missing_skills) ? candidate.missing_skills : []
  const summary = parseSummary(candidate.summary)
  const normalizedCandidate = {
    ...candidate,
    name: candidate.candidate_name || candidate.name || candidate.job_title || 'Application',
    score,
    recommendation: summary?.interview_recommendation || (score >= 80 ? 'Proceed to interview' : score >= 60 ? 'Review manually' : 'Screen this application'),
    matched: matchedSkills,
    missing: missingSkills,
    strengths: summary?.strengths || candidate.job_description || 'Run screening to generate AI strengths from the uploaded resume.',
    weakness: summary?.weaknesses || (missingSkills.length ? `Missing required skills: ${missingSkills.join(', ')}` : 'No required skills are missing from the parsed evidence.'),
    skills: String(candidate.skills_required || '').split(',').map((skill) => {
      const cleanSkill = skill.trim()
      const matched = isSkillMatched(cleanSkill, matchedSkills, missingSkills)
      return {
        name: cleanSkill,
        matched,
        value: matched ? 100 : 0,
      }
    }).filter((skill) => skill.name),
  }

  const handleUpdateResume = async (file) => {
    if (!file) return

    setMessage('')
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('application_id', candidate.id)
      formData.append('resume', file)
      await api.uploadResume(formData)
      await onResumeUpdated?.()
      setMessage('Resume updated. HR will see the latest file after re-screening.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Page title="Application Details" subtitle="AI-generated match score, skill coverage, and feedback.">
      <div className="detail-toolbar">
        <button className="ghost-button compact" onClick={onBack}>
          <ArrowLeft size={18} /> Back to Applications
        </button>
        <div className="detail-toolbar-actions">
          {closeLabel && (
            <span className="muted compact-note">
              {canModifyResume ? `Applications close ${closeLabel}` : `Closed ${closeLabel}`}
            </span>
          )}
          {candidate.resume_id && canModifyResume && (
            <>
              <button className="secondary-button compact" onClick={() => fileInputRef.current?.click()}>
                {uploading ? 'Updating...' : 'Update Resume'} <UploadCloud size={16} />
              </button>
              <button className="secondary-button compact danger" onClick={() => onDeleteResume(candidate.id)}>
                Delete Uploaded Resume
              </button>
            </>
          )}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) {
            handleUpdateResume(file)
          }
          event.target.value = ''
        }}
      />
      {message && <p className={message.includes('updated') ? 'success-text' : 'form-error'}>{message}</p>}
      <CandidateAnalysis candidate={normalizedCandidate} />
    </Page>
  )
}

export default ApplicationDetail
