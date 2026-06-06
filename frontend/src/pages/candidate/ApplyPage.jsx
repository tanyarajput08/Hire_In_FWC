import { ArrowRight, Check, UploadCloud } from 'lucide-react'
import { useState } from 'react'
import Page from '../../components/Page'
import Panel from '../../components/Panel'
import { api } from '../../services/api'
import { formatApplicationCloseAt, isApplicationOpen } from '../../utils/applicationDeadline'

function ApplyPage({ job, navigate, onApplied }) {
  const [fileName, setFileName] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const skills = Array.isArray(job.skills_required)
    ? job.skills_required
    : String(job.skills_required || '').split(',').map((skill) => skill.trim()).filter(Boolean)
  const open = isApplicationOpen(job.application_close_at)
  const closeLabel = formatApplicationCloseAt(job.application_close_at)

  const submitApplication = async () => {
    if (!open) {
      setMessage('Applications for this role are closed.')
      return
    }
    setMessage('')
    if (!resumeFile) {
      setMessage('Choose a resume before submitting.')
      return
    }

    setLoading(true)
    try {
      const application = await api.applyToJob({ job_id: job.id })
      const formData = new FormData()
      formData.append('application_id', application.id)
      formData.append('resume', resumeFile)
      await api.uploadResume(formData)
      await onApplied?.()
      navigate('applications')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Page
      title={`Apply for ${job.title}`}
      subtitle={closeLabel ? `${job.description} ${open ? `(Apply by ${closeLabel})` : `(Closed ${closeLabel})`}` : job.description}
    >
      <div className="two-column align-start">
        <Panel title="Required Skills">
          <div className="skill-list">
            {skills.map((skill) => (
              <span key={skill}>
                <Check size={17} /> {skill}
              </span>
            ))}
          </div>
        </Panel>
        <Panel title="Resume Upload">
          <label className="upload-zone">
            <UploadCloud size={32} />
            <strong>{fileName || 'Choose Resume'}</strong>
            <span>PDF, DOC, or DOCX supported</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(event) => {
                const file = event.target.files?.[0] || null
                setResumeFile(file)
                setFileName(file?.name || '')
              }}
            />
          </label>
          {message && <p className="form-error">{message}</p>}
          <button className="primary-button wide" onClick={submitApplication} disabled={!open || loading}>
            {loading ? 'Submitting...' : open ? 'Submit Application' : 'Applications Closed'} <ArrowRight size={18} />
          </button>
        </Panel>
      </div>
    </Page>
  )
}

export default ApplyPage
