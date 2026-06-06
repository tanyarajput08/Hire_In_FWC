import Page from '../../components/Page'
import Panel from '../../components/Panel'
import StatusPill from '../../components/StatusPill'
import { isApplicationOpen } from '../../utils/applicationDeadline'

function ApplicationsPage({ rows, onOpen, onDeleteResume }) {
  return (
    <Page title="My Applications" subtitle="Review every submitted role and AI score.">
      <Panel title="Application History">
        <div className="responsive-table">
          <table>
            <thead>
              <tr><th>Job</th><th>Status</th><th>Score</th><th>Resume</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const canModifyResume = isApplicationOpen(row.application_close_at)

                return (
                  <tr key={row.id}>
                    <td>{row.job_title}</td>
                    <td><StatusPill label={row.status} /></td>
                    <td>{row.score ? `${row.score}%` : 'Not screened'}</td>
                    <td>{row.resume_id ? 'Uploaded' : 'Missing'}</td>
                    <td>
                      <div className="table-actions">
                        <button className="text-button" onClick={() => onOpen(row)}>Details</button>
                        {row.resume_id && canModifyResume && (
                          <button
                            className="text-button danger"
                            onClick={() => onDeleteResume(row.id)}
                          >
                            Delete Resume
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!rows.length && <p>No applications yet.</p>}
        </div>
      </Panel>
    </Page>
  )
}

export default ApplicationsPage
