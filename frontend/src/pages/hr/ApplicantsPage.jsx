import { useState } from 'react'
import { applicationStatuses } from '../../constants/applicationStatuses'
import Page from '../../components/Page'
import Panel from '../../components/Panel'
import StatusPill from '../../components/StatusPill'

function ApplicantsPage({ candidates, status, onOpen, onScreen, onStatusChange }) {
  const [loadingScreen, setLoadingScreen] = useState({})

  const handleScreen = async (candidateId) => {
    setLoadingScreen((prev) => ({ ...prev, [candidateId]: true }))
    try {
      await onScreen(candidateId)
    } finally {
      setLoadingScreen((prev) => ({ ...prev, [candidateId]: false }))
    }
  }

  return (
    <Page title="Applicants" subtitle="Screen candidates by score, role, and current decision.">
      <Panel title="Job Applicants">
        <div className="responsive-table">
          <table>
            <thead>
              <tr><th>Candidate</th><th>Job</th><th>Score</th><th>Status</th><th>Resume</th><th></th></tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => {
                const id = candidate.application_id || candidate.id
                return (
                  <tr key={id}>
                    <td>{candidate.candidate_name || candidate.name}</td>
                    <td>{candidate.job_title || candidate.role}</td>
                    <td>{candidate.score ? `${candidate.score}%` : 'Not screened'}</td>
                    <td>
                      <StatusPill label={status[id] || candidate.status} />
                      <label className="inline-select">
                        <select
                          value={candidate.status}
                          onChange={(event) => onStatusChange(id, event.target.value)}
                        >
                          {applicationStatuses.map((item) => <option value={item} key={item}>{item}</option>)}
                        </select>
                      </label>
                    </td>
                    <td>{candidate.resume_id ? 'Uploaded' : 'Missing'}</td>
                    <td>
                      <button
                        className="text-button"
                        onClick={() => handleScreen(id)}
                        disabled={loadingScreen[id]}
                      >
                        {loadingScreen[id] ? 'Screening...' : 'Screen'}
                      </button>
                      <button className="text-button" onClick={() => onOpen(id)}>Open</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!candidates.length && <p>No applicants yet for this job.</p>}
        </div>
      </Panel>
    </Page>
  )
}

export default ApplicantsPage
