import { UploadCloud } from 'lucide-react'
import { useState } from 'react'
import Page from '../../components/Page'
import Panel from '../../components/Panel'
import StatusPill from '../../components/StatusPill'
import { api } from '../../services/api'
import { formatApplicationCloseAt, isApplicationOpen } from '../../utils/applicationDeadline'

function UpdateResumePage({ applications = [], onUpdated }) {
  const [uploadingId, setUploadingId] = useState(null)
  const [message, setMessage] = useState('')

  const handleUpload = async (applicationId, file) => {
    if (!file) return

    setMessage('')
    setUploadingId(applicationId)
    try {
      const formData = new FormData()
      formData.append('application_id', applicationId)
      formData.append('resume', file)
      await api.uploadResume(formData)
      await onUpdated?.()
      setMessage('Resume updated successfully. HR will see the latest file after re-screening.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setUploadingId(null)
    }
  }

  return (
    <Page title="Update Resume" subtitle="Replace your resume for any open application.">
      <Panel title="Your Applications">
        {!applications.length && <p>No applications yet. Apply to a job first.</p>}
        {message && <p className={message.includes('success') ? 'success-text' : 'form-error'}>{message}</p>}
        <div className="update-resume-list">
          {applications.map((application) => {
            const open = isApplicationOpen(application.application_close_at)
            const closeLabel = formatApplicationCloseAt(application.application_close_at)

            return (
              <div className="update-resume-card" key={application.id}>
                <div>
                  <h3>{application.job_title}</h3>
                  <div className="chip-row">
                    <StatusPill label={application.status} />
                    <span className="chip">{application.resume_id ? 'Resume uploaded' : 'No resume yet'}</span>
                    {closeLabel && (
                      <span className="chip">{open ? `Closes ${closeLabel}` : `Closed ${closeLabel}`}</span>
                    )}
                  </div>
                </div>
                {open ? (
                  <label className="upload-zone compact">
                    <UploadCloud size={24} />
                    <strong>{uploadingId === application.id ? 'Uploading...' : 'Choose new resume'}</strong>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      disabled={uploadingId === application.id}
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) {
                          handleUpload(application.id, file)
                        }
                        event.target.value = ''
                      }}
                    />
                  </label>
                ) : (
                  <p className="muted">Applications are closed. Resume changes are locked.</p>
                )}
              </div>
            )
          })}
        </div>
      </Panel>
    </Page>
  )
}

export default UpdateResumePage
