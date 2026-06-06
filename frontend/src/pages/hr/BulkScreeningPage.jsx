import { FileStack, UploadCloud } from 'lucide-react'
import { useState } from 'react'
import Page from '../../components/Page'
import Panel from '../../components/Panel'
import ScoreRing from '../../components/ScoreRing'
import { api } from '../../services/api'

function BulkScreeningPage({ jobs = [] }) {
  const [selectedJob, setSelectedJob] = useState(jobs[0]?.id || '')
  const [files, setFiles] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const screenBatch = async () => {
    if (!selectedJob || !files.length) {
      setMessage('Choose a real job and upload at least one resume PDF.')
      return
    }

    const formData = new FormData()
    formData.append('job_id', selectedJob)
    files.forEach((file) => formData.append('resumes', file))

    setLoading(true)
    setMessage('')
    try {
      const response = await api.bulkScreen(formData)
      setResults(response.results || [])
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Page
      title="Bulk Resume Screening"
      subtitle="Upload up to 100 PDFs, match them against a job, and rank candidates instantly."
    >
      <div className="two-column align-start">
        <Panel title="Screening Setup">
          <label className="field">
            <span>Target Job</span>
            <select value={selectedJob} onChange={(event) => setSelectedJob(event.target.value)}>
              <option value="">Select a real job</option>
              {jobs.map((job) => (
                <option value={job.id} key={job.id}>{job.title}</option>
              ))}
            </select>
          </label>
          <label className="upload-zone">
            <UploadCloud size={32} />
            <strong>{files.length ? `${files.length} resumes selected` : 'Upload Resume Batch'}</strong>
            <span>PDF files only. Backend accepts up to 100 files.</span>
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={(event) => setFiles(Array.from(event.target.files || []))}
            />
          </label>
          <button className="primary-button wide" onClick={screenBatch} disabled={loading}>
            {loading ? 'Screening...' : 'Parse All and Rank'} <FileStack size={18} />
          </button>
          {message && <p className="form-message error">{message}</p>}
        </Panel>

        <Panel title="What Happens">
          <div className="pipeline-list">
            {['Parse PDFs', 'Extract Skills', 'Match Against JD', 'Generate Scores', 'Rank Candidates'].map((step) => (
              <span key={step}>{step}</span>
            ))}
          </div>
        </Panel>
      </div>

      {results.length > 0 && (
        <Panel title="Ranked Batch Results">
          <div className="bulk-results">
            {results.map((result, index) => (
              <div className="bulk-result-row" key={result.id}>
                <span className={`rank-badge rank-${index + 1}`}>#{index + 1}</span>
                <div>
                  <strong>{result.file_name}</strong>
                  <span>
                    {typeof result.summary === 'object' && result.summary
                      ? result.summary.interview_recommendation || result.summary.strengths || 'AI screening completed.'
                      : result.summary || 'AI screening completed from uploaded resume.'}
                  </span>
                  <div className="chip-row">
                    {(result.matched_skills || []).map((skill) => <span className="chip" key={skill}>{skill}</span>)}
                  </div>
                </div>
                <ScoreRing value={result.score} />
              </div>
            ))}
          </div>
        </Panel>
      )}
    </Page>
  )
}

export default BulkScreeningPage
