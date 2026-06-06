import { PlayCircle, UploadCloud } from 'lucide-react'
import { useState, useEffect } from 'react'
import Page from '../../components/Page'
import Panel from '../../components/Panel'
import ScoreRing from '../../components/ScoreRing'
import { api } from '../../services/api'

function InterviewAnalysisPage({ jobs = [], applications = [] }) {
  const [selectedJob, setSelectedJob] = useState('')
  const [selectedApplication, setSelectedApplication] = useState('')
  const [videoFile, setVideoFile] = useState(null)
  const [videoName, setVideoName] = useState('')
  const [transcript, setTranscript] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const [progress, setProgress] = useState(0)
  const [loadingStage, setLoadingStage] = useState('')
  const [elapsedTime, setElapsedTime] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState(0)

  useEffect(() => {
    if (jobs.length && !jobs.some((job) => String(job.id) === String(selectedJob))) {
      Promise.resolve().then(() => setSelectedJob(String(jobs[0].id)))
    }
  }, [jobs, selectedJob])

  useEffect(() => {
    Promise.resolve().then(() => {
      if (applications && applications.length > 0) {
        setSelectedApplication(applications[0]?.id || applications[0]?.application_id || '')
      } else {
        setSelectedApplication('')
      }
    })
  }, [applications])

  const selectedJobRecord = jobs.find((job) => String(job.id) === String(selectedJob))

  const analyzeInterview = async () => {
    if (!selectedApplication || !selectedJobRecord?.description) {
      setMessage('Choose a real application and job before analyzing.')
      return
    }

    if (!videoFile && !transcript.trim()) {
      setMessage('Upload an interview video or paste a transcript.')
      return
    }

    const formData = new FormData()
    formData.append('application_id', selectedApplication)
    formData.append('job_id', selectedJob)
    formData.append('job_description', selectedJobRecord.description)
    if (transcript.trim()) formData.append('transcript', transcript.trim())
    if (videoFile) formData.append('answer_video', videoFile)

    let est = 8
    if (videoFile) {
      const sizeMB = videoFile.size / (1024 * 1024)
      est = Math.max(25, Math.round(sizeMB * 3.5 + 20))
    }

    setEstimatedTime(est)
    setProgress(0)
    setElapsedTime(0)
    setLoadingStage(videoFile ? 'Uploading video recording...' : 'Sending transcript data...')
    setResult(null)
    setLoading(true)
    setMessage('')

    const startTime = Date.now()

    const timerInterval = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    const progressInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      const ratio = elapsed / est
      let newProgress

      if (videoFile) {
        if (ratio < 0.2) {
          newProgress = ratio * 150
          setLoadingStage('Uploading media files to server...')
        } else if (ratio < 0.6) {
          newProgress = 30 + (ratio - 0.2) * 100
          setLoadingStage('Transcribing audio with Speech-to-Text (Whisper)...')
        } else if (ratio < 0.9) {
          newProgress = 70 + (ratio - 0.6) * 80
          setLoadingStage('Evaluating communication flow and confidence...')
        } else {
          newProgress = 94 + (1 - Math.exp(-(ratio - 0.9) * 2)) * 1
          setLoadingStage('Generating detailed scoring recommendation...')
        }
      } else {
        if (ratio < 0.3) {
          newProgress = ratio * 166
          setLoadingStage('Analyzing response vocabulary and density...')
        } else if (ratio < 0.8) {
          newProgress = 50 + (ratio - 0.3) * 88
          setLoadingStage('Matching answers against job description...')
        } else {
          newProgress = 94 + (1 - Math.exp(-(ratio - 0.8) * 2)) * 1
          setLoadingStage('Calculating final overall relevance...')
        }
      }

      setProgress(Math.min(95, newProgress))
    }, 200)

    try {
      const response = await api.analyzeInterview(formData)
      setResult(response)
      setProgress(100)
    } catch (error) {
      setMessage(error.message)
    } finally {
      clearInterval(timerInterval)
      clearInterval(progressInterval)
      setLoading(false)
    }
  }

  return (
    <Page
      title="Video Interview Analysis"
      subtitle="Analyze communication, technical relevance, confidence, and overall interview strength."
    >
      <div className="two-column align-start">
        <Panel title="Interview Input">
          <label className="field">
            <span>Target Job</span>
            <select value={selectedJob} onChange={(event) => setSelectedJob(event.target.value)}>
              <option value="">Select a real job</option>
              {jobs.map((job) => (
                <option value={job.id} key={job.id}>{job.title}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Application</span>
            <select value={selectedApplication} onChange={(event) => setSelectedApplication(event.target.value)}>
              <option value="">Select a real application</option>
              {applications.map((application) => {
                const id = application.application_id || application.id
                return (
                  <option value={id} key={id}>
                    {application.candidate_name || application.candidate_email || `Application #${id}`}
                  </option>
                )
              })}
            </select>
          </label>
          <label className="upload-zone" style={{ minHeight: '140px', marginBottom: '10px' }}>
            <UploadCloud size={32} />
            <strong>{videoName || 'Upload Interview Video'}</strong>
            <span style={{ fontSize: '12px' }}>MP4 upload is supported. Transcript scoring works immediately.</span>
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={(event) => {
                const file = event.target.files?.[0] || null
                setVideoFile(file)
                setVideoName(file?.name || '')
              }}
            />
          </label>
          <label className="field" style={{ marginTop: '8px', marginBottom: '10px' }}>
            <span>Transcript</span>
            <textarea rows="4" value={transcript} onChange={(event) => setTranscript(event.target.value)} />
          </label>
          <button className="primary-button wide" style={{ marginTop: '6px' }} onClick={analyzeInterview} disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze Interview'} <PlayCircle size={18} />
          </button>
          
          {loading && (
            <div style={{ marginTop: '20px', display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800 }}>
                <span className="muted">{loadingStage}</span>
                <strong style={{ color: '#60a5fa' }}>{Math.round(progress)}%</strong>
              </div>
              <progress value={progress} max="100" />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }} className="muted">
                <span>Elapsed: {elapsedTime}s</span>
                <span>
                  Est. remaining:{' '}
                  {estimatedTime - elapsedTime > 2
                    ? `${Math.round(estimatedTime - elapsedTime)}s`
                    : 'Almost done...'}
                </span>
              </div>
            </div>
          )}

          {message && <p className="form-message error">{message}</p>}
        </Panel>

        <Panel title="Scoring Model">
          <div className="pipeline-list">
            <span>Speech-to-Text</span>
            <span>Technical Relevance</span>
            <span>Communication Quality</span>
            <span>Confidence Signals</span>
            <span>Final Recommendation</span>
          </div>
        </Panel>
      </div>

      {result && (
        <Panel title="Interview Result">
          <div className="interview-score-grid">
            <ScoreMetric label="Communication" value={result.communication_score} />
            <ScoreMetric label="Technical Relevance" value={result.technical_relevance_score} />
            <ScoreMetric label="Confidence" value={result.confidence_score} />
            <ScoreMetric label="Overall" value={result.overall_score} />
          </div>
          <div className="ai-summary">
            <h3>AI Interview Feedback</h3>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{result.feedback}</p>
          </div>
          {result.transcript && (
            <div className="ai-summary" style={{ marginTop: '20px' }}>
              <h3>Candidate Transcript</h3>
              <p style={{ fontStyle: 'italic', color: '#cbd5e1', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                "{result.transcript}"
              </p>
            </div>
          )}
        </Panel>
      )}
    </Page>
  )
}

function ScoreMetric({ label, value }) {
  return (
    <div className="score-metric">
      <ScoreRing value={value} />
      <span>{label}</span>
    </div>
  )
}

export default InterviewAnalysisPage
