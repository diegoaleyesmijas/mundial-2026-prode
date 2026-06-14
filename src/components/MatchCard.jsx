import { formatMatchTime, getMatchResultLabel, getFlagForTeam } from '../lib/api';

export default function MatchCard({ match, timezone }) {
  const resolvedTime = formatMatchTime(match.utcDate, timezone);
  const isLive = match.status === 'LIVE';
  const hasScore = match.homeScore != null && match.awayScore != null;
  const resultLabel = hasScore ? getMatchResultLabel(match) : null;

  return (
    <article className={`match-card ${isLive ? 'match-card--live' : ''}`}>
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
          {hasScore ? (
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
        <span className="match-group">{match.group || match.stage || match.round}</span>
        <span className="match-venue">{resolvedTime} · {match.venue}</span>
      </div>

      {resultLabel && (
        <div className="match-card__footer">
          Resultado real: <strong>{resultLabel}</strong>
        </div>
      )}
    </article>
  );
}
