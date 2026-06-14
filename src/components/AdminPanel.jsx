import { useState } from 'react';
import { getMatchOutcome } from '../lib/api';

export default function AdminPanel({
  isAdmin,
  adminVerified,
  members,
  predictions,
  matches,
  userName,
  leagueId,
  onAddMember,
  onRemoveMember,
  leaguePin,
}) {
  const [expandedMember, setExpandedMember] = useState(null);
  const [newMemberName, setNewMemberName] = useState('');

  if (!isAdmin && !adminVerified) return null;

  const stats = members.reduce(
    (acc, member) => {
      const userPredictions = predictions[member] || {};
      return {
        totalPredictions: acc.totalPredictions + Object.keys(userPredictions).length,
      };
    },
    { totalPredictions: 0 },
  );

  const adminRanking = members
    .map((member) => {
      const userPredictions = predictions[member] || {};
      const finishedMatches = matches.filter((m) => m.status === 'FINISHED' && m.homeScore != null);
      let correct = 0;
      let points = 0;
      finishedMatches.forEach((match) => {
        const outcome = getMatchOutcome(match);
        const predicted = userPredictions[match.id];
        if (predicted && predicted === outcome) {
          correct++;
          points += 3;
        }
      });
      return {
        member,
        predictionsCount: Object.keys(userPredictions).length,
        correct,
        points,
        isHost: member === userName,
      };
    })
    .sort((a, b) => b.points - a.points || b.correct - a.correct);

  function handleAdd() {
    const name = newMemberName.trim();
    if (!name) return;
    onAddMember(name);
    setNewMemberName('');
  }

  return (
    <section className="section active">
      <div className="panel admin-panel">
        <div className="panel-header">
          <div>
            <span className="panel-tag">
              👑 Administración
              {adminVerified && !isAdmin && <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem', opacity: 0.7 }}>(verificado con PIN)</span>}
            </span>
            <h2>Gestión de participantes</h2>
          </div>
        </div>

        <div className="admin-stats">
          <div className="admin-stat">
            <span className="admin-stat-value">{members.length}</span>
            <span className="admin-stat-label">Participantes</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-value">{stats.totalPredictions}</span>
            <span className="admin-stat-label">Pronósticos</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-value">{members.filter((m) => m !== userName).length}</span>
            <span className="admin-stat-label">Invitados</span>
          </div>
        </div>

        <div className="admin-add-form">
          <input
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            placeholder="Nombre del nuevo participante"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button className="btn btn-primary" type="button" onClick={handleAdd} disabled={!newMemberName.trim()}>
            + Agregar
          </button>
        </div>

        <p className="pin-hint">
          Los nuevos participantes necesitan el PIN de la liga para unirse: <strong>{leaguePin}</strong>
        </p>

        <div className="participants-table">
          <div className="participants-row participants-row--head">
            <span>#</span>
            <span>Participante</span>
            <span>Prodes</span>
            <span>Aciertos</span>
            <span>Puntos</span>
            <span></span>
          </div>
          {adminRanking.map((entry, index) => (
            <div key={entry.member}>
              <div
                className={`participants-row ${entry.isHost ? 'me' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setExpandedMember(expandedMember === entry.member ? null : entry.member)}
              >
                <span>{index + 1}</span>
                <strong>
                  {entry.member} {entry.isHost ? '👑' : ''}
                </strong>
                <span>{entry.predictionsCount}</span>
                <span>{entry.correct}</span>
                <span>{entry.points}</span>
                <span className="admin-actions">
                  {!entry.isHost && (
                    <button
                      className="btn-icon btn-remove"
                      title="Eliminar participante"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Eliminar a ${entry.member} de la liga?`)) {
                          onRemoveMember(entry.member);
                        }
                      }}
                    >
                      ✕
                    </button>
                  )}
                  <span className="admin-expand-icon">
                    {expandedMember === entry.member ? '▲' : '▼'}
                  </span>
                </span>
              </div>
              {expandedMember === entry.member && (
                <div className="admin-predictions-detail">
                  {matches
                    .filter((m) => m.status === 'FINISHED')
                    .map((match) => {
                      const prediction = predictions[entry.member]?.[match.id];
                      if (!prediction) return null;
                      const outcome = getMatchOutcome(match);
                      const isCorrect = prediction === outcome;
                      return (
                        <div key={match.id} className="admin-prediction-item">
                          <span className="admin-match-name">
                            {match.home} vs {match.away}
                          </span>
                          <span className="admin-real-result">
                            {match.homeScore}-{match.awayScore}
                          </span>
                          <span className={`admin-prediction-badge ${isCorrect ? 'correct' : 'wrong'}`}>
                            {prediction === 'HOME' ? match.home : prediction === 'AWAY' ? match.away : 'Empate'}
                          </span>
                          <span className={isCorrect ? 'admin-correct' : 'admin-wrong'}>
                            {isCorrect ? '+3 pts' : '0 pts'}
                          </span>
                        </div>
                      );
                    })}
                  {matches.filter((m) => m.status === 'FINISHED').length === 0 && (
                    <div className="admin-no-data">No hay partidos finalizados aún.</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
