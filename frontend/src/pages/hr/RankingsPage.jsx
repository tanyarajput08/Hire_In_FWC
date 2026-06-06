import Page from '../../components/Page'
import ScoreRing from '../../components/ScoreRing'
import StatusPill from '../../components/StatusPill'

function RankingsPage({ candidates, status, onOpen }) {
  return (
    <Page title="Rankings" subtitle="Leaderboard view for the strongest candidates.">
      <div className="leaderboard">
        {[...candidates]
          .sort((a, b) => b.score - a.score)
          .map((candidate, index) => (
            <button className="leaderboard-row" key={candidate.application_id || candidate.id} onClick={() => onOpen(candidate.application_id || candidate.id)}>
              <span className={`rank-badge rank-${index + 1}`}>#{index + 1}</span>
              <div>
                <strong>{candidate.candidate_name || candidate.name}</strong>
                <span>{candidate.job_title || candidate.role}</span>
              </div>
              <StatusPill label={status[candidate.application_id || candidate.id] || candidate.status} />
              <ScoreRing value={Number(candidate.score || 0)} />
            </button>
          ))}
      </div>
    </Page>
  )
}

export default RankingsPage
