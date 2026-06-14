import { formatMatchTime, getFlagForTeam, isMatchStarted, getMatchOutcome } from '../lib/api';

export default function ProdeCard({ match, selected, onPredict, timezone, disabled }) {
  const time = formatMatchTime(match.utcDate, timezone);
  const matchStarted = isMatchStarted(match);
  const isFinished = match.status === 'FINISHED';
  const correctOutcome = isFinished ? getMatchOutcome(match) : null;
  const wasCorrect = selected && correctOutcome && selected === correctOutcome;

  return (
    <article className={`match-card ${match.status === 'LIVE' ? 'match-card--live' : ''}`}>
      <div className="match-meta">
        <span className="match-round">{match.round || match.stage}</span>
        <span className={`status-badge status-${match.status.toLowerCase()}`}>
          {match.status === 'LIVE' ? 'En vivo' : match.status === 'FINISHED' ? 'Finalizado' : 'Programado'}
        </span>
      </div>

      <div className="match-teams">
        <div className="team">
          <div className="team-name">
            <span className="country-flag">{match.homeFlag || getFlagForTeam(match.home)}</span>
            {match.home}
          </div>
        </div>

        <div className="vs-block">
          {isFinished ? (
            <div className="match-score">
              {match.homeScore} — {match.awayScore}
            </div>
          ) : (
            <div className="vs">VS</div>
          )}
        </div>

        <div className="team team-right">
          <div className="team-name">
            <span className="country-flag">{match.awayFlag || getFlagForTeam(match.away)}</span>
            {match.away}
          </div>
        </div>
      </div>

      <div className="match-card__info">
        <span className="match-group">{match.group || match.stage}</span>
        <span className="match-venue">{time} · {match.venue}</span>
      </div>

      <div className="match-card__prediction">
        <div className="prediction-title">Tu apuesta</div>
        <div className="prediction-buttons">
          <button
            className={`prediction-btn${selected === 'HOME' ? ' active' : ''}${wasCorrect === false && selected === 'HOME' ? ' wrong' : ''}${wasCorrect === true && selected === 'HOME' ? ' correct' : ''}`}
            onClick={() => onPredict(match.id, 'HOME')}
            disabled={disabled || matchStarted}
          >
            {match.home}
          </button>

          <button
            className={`prediction-btn${selected === 'DRAW' ? ' active' : ''}${wasCorrect === false && selected === 'DRAW' ? ' wrong' : ''}${wasCorrect === true && selected === 'DRAW' ? ' correct' : ''}`}
            onClick={() => onPredict(match.id, 'DRAW')}
            disabled={disabled || matchStarted}
          >
            Empate
          </button>

          <button
            className={`prediction-btn${selected === 'AWAY' ? ' active' : ''}${wasCorrect === false && selected === 'AWAY' ? ' wrong' : ''}${wasCorrect === true && selected === 'AWAY' ? ' correct' : ''}`}
            onClick={() => onPredict(match.id, 'AWAY')}
            disabled={disabled || matchStarted}
          >
            {match.away}
          </button>
        </div>
      </div>

      {isFinished && (
        <div className="match-card__footer">
          Resultado: <strong>{match.homeScore} — {match.awayScore}</strong>
          {selected && (
            <span className={`prediction-status ${wasCorrect ? 'correct' : 'wrong'}`}>
              {wasCorrect ? '✓ Acertaste' : '✗ No acertaste'}
            </span>
          )}
        </div>
      )}

      {match.status === 'LIVE' && (
        <div className="match-card__footer">
          <span className="status-live-indicator">🔴 En vivo</span>
        </div>
      )}
    </article>
  );
}
