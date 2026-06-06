import { Sparkles } from 'lucide-react'
import Panel from './Panel'
import ScoreRing from './ScoreRing'
import SkillColumn from './SkillColumn'

function CandidateAnalysis({ candidate }) {
  return (
    <div className="analysis-grid">
      <div className="score-card">
        <ScoreRing value={candidate.score} size="large" />
        <div>
          <span className="muted">Match Score</span>
          <h3>{candidate.recommendation}</h3>
        </div>
      </div>
      <div className="skill-columns">
        <SkillColumn title="Matched Skills" items={candidate.matched} type="match" />
        <SkillColumn title="Missing Skills" items={candidate.missing} type="missing" />
      </div>
      <Panel title="Skill Match Visualization" flat>
        {candidate.skills.length > 0 ? (
          candidate.skills.map((skill) => (
            <div className="skill-meter" key={skill.name}>
              <div>
                <span>{skill.name}</span>
                <strong>{skill.matched ? 'Found' : 'Missing'}</strong>
              </div>
              <progress value={skill.value} max="100" />
            </div>
          ))
        ) : (
          <p className="muted">No required skills are available for this job.</p>
        )}
      </Panel>
      <div className="ai-summary">
        <h3>
          <Sparkles size={20} /> AI Summary
        </h3>
        <p>
          <strong>Strengths:</strong> {candidate.strengths}
        </p>
        <p>
          <strong>Weaknesses:</strong> {candidate.weakness}
        </p>
        <p>
          <strong>Recommendation:</strong> {candidate.recommendation}.
        </p>
      </div>
    </div>
  )
}

export default CandidateAnalysis
