import MatchCard from './MatchCard';

const filterButtons = [
  { id: 'TODAY', label: 'Hoy' },
  { id: 'GROUPS', label: 'Fase de grupos' },
  { id: 'KNOCKOUT', label: 'Eliminatorias' },
];

export default function Fixture({
  active,
  matches,
  filter,
  onFilterChange,
  groupTables,
  topScorers,
  loading,
  timezone,
}) {
  if (!active) return null;

  const liveMatches = matches.filter((m) => m.status === 'LIVE');
  const upcomingMatches = matches.filter((m) => m.status === 'SCHEDULED' || m.status === 'POSTPONED');
  const finishedMatches = matches.filter((m) => m.status === 'FINISHED');
  const knockoutStages = [...new Set(matches.filter((m) => m.stage !== 'Grupos').map((m) => m.round))];

  return (
    <section className="section active">
      <div className="section-header">
        <div>
          <span className="panel-tag">Fixture inteligente</span>
          <h2>Calendario oficial</h2>
        </div>
        <div className="filters">
          {filterButtons.map((button) => (
            <button
              key={button.id}
              className={filter === button.id ? 'filter-btn active' : 'filter-btn'}
              onClick={() => onFilterChange(button.id)}
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>

      {groupTables.length > 0 && (
        <div className="group-tables-grid">
          {groupTables.map((group) => (
            <div key={group.name} className="group-table">
              <div className="group-table__header">{group.name}</div>
              <div className="group-table__row group-table__row--head">
                <span>Equipo</span>
                <span>Pts</span>
                <span>GF</span>
                <span>GC</span>
                <span>DG</span>
              </div>
              {group.teams.map((team) => (
                <div key={team.name} className="group-table__row">
                  <span className="group-table__team">
                    <span className="country-flag">{team.flag}</span>
                    {team.name}
                  </span>
                  <span>{team.points}</span>
                  <span>{team.goalsFor}</span>
                  <span>{team.goalsAgainst}</span>
                  <span>{team.goalDiff}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {topScorers.length > 0 && (
        <div className="scorers-panel panel">
          <div className="panel-header">
            <div>
              <span className="panel-tag">Goleadores</span>
              <h2>Máximos anotadores</h2>
            </div>
          </div>
          <div className="scorers-grid">
            {topScorers.map((scorer) => (
              <div key={`${scorer.player}-${scorer.team}`} className="scorer-card">
                <span className="scorer-flag">{scorer.flag}</span>
                <div>
                  <strong>{scorer.player}</strong>
                  <div className="scorer-team">{scorer.team}</div>
                </div>
                <div className="scorer-goals">{scorer.goals} goles</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="loader">Cargando datos del fixture...</div>
      ) : (
        <>
          {liveMatches.length > 0 && (
            <>
              <div className="group-header">🔴 En vivo hoy</div>
              <div className="match-grid">
                {liveMatches.map((match) => (
                  <MatchCard key={match.id} match={match} timezone={timezone} />
                ))}
              </div>
            </>
          )}

          {upcomingMatches.length > 0 && (
            <>
              <div className="group-header">📅 Próximos partidos</div>
              <div className="match-grid">
                {upcomingMatches.map((match) => (
                  <MatchCard key={match.id} match={match} timezone={timezone} />
                ))}
              </div>
            </>
          )}

          {knockoutStages.length > 0 && (
            <>
              <div className="group-header">🏟️ Fase final</div>
              {knockoutStages.map((stage) => (
                <div key={stage} className="stage-block">
                  <div className="stage-title">{stage}</div>
                  <div className="match-grid">
                    {matches.filter((match) => match.round === stage).map((match) => (
                      <MatchCard key={match.id} match={match} timezone={timezone} />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {finishedMatches.length > 0 && (
            <>
              <div className="group-header">✅ Resultados recientes</div>
              <div className="match-grid">
                {finishedMatches.map((match) => (
                  <MatchCard key={match.id} match={match} timezone={timezone} />
                ))}
              </div>
            </>
          )}

          {!loading && matches.length === 0 && (
            <div className="loader">No hay partidos disponibles para este filtro.</div>
          )}
        </>
      )}
    </section>
  );
}
