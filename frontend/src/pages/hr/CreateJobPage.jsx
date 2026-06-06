import { Plus } from 'lucide-react'
import { useState } from 'react'
import Page from '../../components/Page'
import Panel from '../../components/Panel'
import TextField from '../../components/TextField'
import { api } from '../../services/api'

function CreateJobPage({ onCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    skills_required: '',
    type: 'Full-Time',
    mode: 'On-site',
    application_close_at: '',
    auto_screen: false,
  })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const createJob = async () => {
    setMessage('')
    setLoading(true)
    try {
      await api.createJob({
        ...form,
        application_close_at: form.application_close_at
          ? new Date(form.application_close_at).toISOString()
          : null,
      })
      setForm({
        title: '',
        description: '',
        skills_required: '',
        type: 'Full-Time',
        mode: 'On-site',
        application_close_at: '',
        auto_screen: false,
      })
      setMessage('Job created successfully.')
      await onCreated?.()
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Page title="Create Job" subtitle="Publish a role and define the skills TalentIQ should screen against.">
      <Panel title="Job Details">
        <form className="job-form">
          <TextField
            label="Job Title"
            placeholder="AI Engineer"
            value={form.title}
            onChange={(event) => updateField('title', event.target.value)}
          />
          <label className="field">
            <span>Description</span>
            <textarea
              placeholder="Describe role responsibilities and expectations"
              rows="5"
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
            />
          </label>
          <label className="field">
            <span>Required Skills</span>
            <textarea
              placeholder="Python, FastAPI, SQL, Docker"
              rows="3"
              value={form.skills_required}
              onChange={(event) => updateField('skills_required', event.target.value)}
            />
          </label>
          <div className="form-grid two-column align-start">
            <label className="field">
              <span>Job Type</span>
              <select value={form.type} onChange={(event) => updateField('type', event.target.value)}>
                <option value="Full-Time">Full-Time</option>
                <option value="Internship">Internship</option>
              </select>
            </label>
            <label className="field">
              <span>Work Mode</span>
              <select value={form.mode} onChange={(event) => updateField('mode', event.target.value)}>
                <option value="On-site">On-site</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </label>
          </div>
          <label className="field">
            <span>Application Close Date & Time</span>
            <input
              type="datetime-local"
              value={form.application_close_at}
              onChange={(event) => updateField('application_close_at', event.target.value)}
            />
          </label>
          <label className="field checkbox-field" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '12px', marginBottom: '16px' }}>
            <input
              type="checkbox"
              checked={form.auto_screen}
              onChange={(event) => updateField('auto_screen', event.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Auto-screen Uploaded Resumes</span>
          </label>
          {message && <p className={message.includes('success') ? 'success-text' : 'form-error'}>{message}</p>}
          <button className="primary-button" type="button" onClick={createJob}>
            {loading ? 'Creating...' : 'Create Job'} <Plus size={18} />
          </button>
        </form>
      </Panel>
    </Page>
  )
}

export default CreateJobPage
