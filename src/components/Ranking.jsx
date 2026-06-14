export default function Ranking({
  active,
  participantRows,
  finalPointsMap,
  userName,
  leagueLink,
  onCopyLink,
  copyMessage,
}) {
  if (!active) return null;

  return (
    <section className="section active">
      <div className="participants-card">
        <div className="ranking-header">🏆 Participantes</div>
        {participantRows.length === 0 ? (
          <div className="ranking-empty">Todavía no hay participantes en esta liga.</div>
        ) : (
          <div className="participants-table">
            <div className="participants-row participants-row--head">
              <span>#</span>
              <span>Participante</span>
              <span>Prodes</span>
              <span>Aciertos</span>
              <span>Pts Grupo</span>
              <span>Pts Final</span>
              <span>Total</span>
            </div>
            {participantRows.map((participant, index) => {
              const fp = finalPointsMap?.[participant.member];
              const finalPts = fp?.points || 0;
              const total = (participant.points || 0) + finalPts;
              return (
                <div
                  key={participant.member}
                  className={`participants-row ${participant.member === userName ? 'me' : ''}`}
                >
                  <span>{index + 1}</span>
                  <strong>{participant.member}</strong>
                  <span>{participant.predictionsCount}</span>
                  <span>{participant.correct}</span>
                  <span>{participant.points}</span>
                  <span className={fp?.hasSelections ? 'final-points-set' : 'final-points-empty'}>
                    {fp?.hasSelections ? finalPts : '—'}
                  </span>
                  <span className="total-points">{total}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {leagueLink && (
        <div className="share-section">
          <div className="share-title">📤 Invitar amigos</div>
          <div className="share-desc">
            Compartí tu link de liga para que tus amigos se sumen y jueguen en el mismo ranking.
          </div>
          <input className="share-input" type="text" value={leagueLink} readOnly aria-label="Enlace de liga" />
          <button className="share-btn" type="button" onClick={onCopyLink}>
            Copiar link de invitación
          </button>
          {copyMessage && <p className="copy-note">{copyMessage}</p>}
        </div>
      )}
    </section>
  );
}
