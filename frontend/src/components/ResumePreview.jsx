import { FileText } from 'lucide-react'
import Panel from './Panel'

function ResumePreview({ candidate, previewUrl }) {
  return (
    <Panel title="Resume Preview" action={<span className="status-pill">{candidate.resume}</span>}>
      {previewUrl ? (
        <iframe className="resume-frame" src={previewUrl} title={`${candidate.name} resume`} />
      ) : (
        <div className="resume-preview">
          <FileText size={42} />
          <h3>{candidate.name}</h3>
          <p>No uploaded resume is available for this real candidate yet.</p>
        </div>
      )}
    </Panel>
  )
}

export default ResumePreview
