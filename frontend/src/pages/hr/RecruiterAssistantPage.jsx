import { Bot, Search, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import Page from '../../components/Page'
import Panel from '../../components/Panel'
import ScoreRing from '../../components/ScoreRing'
import StatusPill from '../../components/StatusPill'
import { api } from '../../services/api'

const suggestedPrompts = [
  'Which candidates have Docker experience?',
  'Who is best suited for a backend role?',
  'Which candidates should I shortlist first?',
]

function RecruiterAssistantPage({ candidates = [] }) {
  const [question, setQuestion] = useState(suggestedPrompts[0])
  const [answer, setAnswer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const candidateContext = useMemo(() => {
    return candidates.map((candidate) => ({
      candidate_id: candidate.candidate_id || candidate.id,
      name: candidate.candidate_name || candidate.name || candidate.candidate_email || 'Candidate',
      role: candidate.job_title || candidate.role || 'Applicant',
      score: candidate.score,
      status: candidate.status,
      skills: [
        ...(candidate.matched_skills || []),
        ...(candidate.missing_skills || []),
        ...String(candidate.skills_required || '')
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
      ].filter((skill, index, list) => skill && list.indexOf(skill) === index),
      resume_text: [
        typeof candidate.summary === 'string' ? candidate.summary : '',
        candidate.job_description,
        candidate.resume_file_path ? `Uploaded resume file: ${candidate.resume_file_path}` : '',
        candidate.candidate_email ? `Candidate email: ${candidate.candidate_email}` : '',
      ].filter(Boolean).join('\n'),
    }))
  }, [candidates])

  const askAssistant = async () => {
    if (!candidateContext.length) {
      setAnswer(null)
      setError('No real applicants are available yet. Create a job and have candidates apply with resumes first.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await api.askRecruiterAssistant({
        question,
        candidates: candidateContext,
      })
      setAnswer({
        text: response.answer,
        matches: response.matches || [],
      })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Page
      title="Recruiter AI Assistant"
      subtitle="Ask natural language questions across candidate resumes, skills, scores, and workflow status."
    >
      <div className="two-column align-start">
        <Panel title="Ask TalentIQ">
          <div className="assistant-box">
            <Bot size={28} />
            <label className="field">
              <span>Question</span>
              <textarea rows="5" value={question} onChange={(event) => setQuestion(event.target.value)} />
            </label>
            <button className="primary-button wide" onClick={askAssistant} disabled={loading}>
              {loading ? 'Asking...' : 'Ask Assistant'} <Send size={18} />
            </button>
            {error && <p className="form-message error">{error}</p>}
          </div>
        </Panel>

        <Panel title="Suggested Questions">
          <div className="prompt-list">
            {suggestedPrompts.map((prompt) => (
              <button key={prompt} onClick={() => setQuestion(prompt)}>
                <Search size={17} /> {prompt}
              </button>
            ))}
          </div>
        </Panel>
      </div>

      {answer && (
        <Panel title="AI Answer">
          <div className="ai-summary">
            <h3><Bot size={20} /> Recruiter Assistant</h3>
            <p>{answer.text}</p>
          </div>
          <div className="assistant-results">
            {answer.matches.map((candidate) => (
              <div className="assistant-result" key={candidate.candidate_id}>
                <ScoreRing value={Math.round(candidate.score || candidate.similarity)} />
                <div>
                  <strong>{candidate.name}</strong>
                  <span>{candidate.role}</span>
                  <p>{candidate.evidence}</p>
                  <div className="chip-row">
                    {candidate.skills.slice(0, 5).map((skill) => (
                      <span className="chip" key={skill}>{skill}</span>
                    ))}
                  </div>
                </div>
                <StatusPill label={candidate.status} />
              </div>
            ))}
            {!answer.matches.length && <p>No matching candidates were returned from the AI engine.</p>}
          </div>
        </Panel>
      )}
    </Page>
  )
}

export default RecruiterAssistantPage
