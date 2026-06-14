import { useState } from 'react';
import ProdeCard from './ProdeCard';

const FINAL_CATEGORIES = [
  { key: 'champion', label: '🥇 Campeón', points: 10 },
  { key: 'runner_up', label: '🥈 Subcampeón', points: 6 },
  { key: 'third_place', label: '🥉 Tercer puesto', points: 4 },
  { key: 'fourth_place', label: '4️⃣ Cuarto puesto', points: 2 },
];

export default function Prode({
  active,
  matches,
  predictions,
  finalPredictions,
  allTeams,
  userName,
  onPredict,
  onFinalPredict,
  timezone,
  disabled,
  finalLocked,
  leagueId,
}) {
  const [showGuide, setShowGuide] = useState(() => {
    if (!leagueId) return true;
    try {
      return localStorage.getItem(`mundial2026_guide_${leagueId}`) !== 'dismissed';
    } catch {
      return true;
    }
  });

  function dismissGuide() {
    setShowGuide(false);
    try {
      if (leagueId) localStorage.setItem(`mundial2026_guide_${leagueId}`, 'dismissed');
    } catch {}
  }

  if (!active) return null;

  // Group stage matches only
  const stageData = [{ stageName: 'Grupos', items: matches.filter((m) => m.stage === 'Grupos') }].filter(
    (s) => s.items.length > 0,
  );

  const userFinal = finalPredictions?.[userName] || {};
  const hasDuplicates = (() => {
    const selected = Object.values(userFinal).filter(Boolean);
    return selected.length !== new Set(selected).size;
  })();

  return (
    <section className="section active">
      {showGuide && (
        <div className="guide-banner">
          <div className="guide-banner-content">
            <div className="guide-banner-icon">🎯</div>
            <div className="guide-banner-text">
              <strong>¿Cómo funciona?</strong>
              <ul>
                <li>Pronosticá el resultado de cada partido de la <strong>fase de grupos</strong></li>
                <li>Cada acierto suma <strong>+3 puntos</strong></li>
                <li>Cuando terminen los grupos, vas a predecir los <strong>clasificados a octavos</strong></li>
                <li>Elegí tu <strong>Predicción Final</strong>: Campeón, Subcampeón, 3° y 4° puesto</li>
              </ul>
            </div>
            <button type="button" className="guide-banner-close" onClick={dismissGuide}>
              Entendido ✕
            </button>
          </div>
        </div>
      )}

      <div className="prode-header">
        <div>
          <h3>Prode grupos</h3>
          <p>Pronosticá todos los partidos de la fase de grupos.</p>
        </div>
        <div className="prode-icon">🎯</div>
      </div>

      {matches.length === 0 ? (
        <div className="loader">Cargando partidos...</div>
      ) : (
        <>
          {/* Final Predictions */}
          <div className="stage-panel final-predictions-panel">
            <div className="group-header">🏆 Predicción Final</div>
            <p className="final-predictions-desc">
              Elegí quiénes creés que llegarán a las primeras 4 posiciones.
              {finalLocked
                ? ' Las predicciones finales están bloqueadas.'
                : ' Podés cambiarlas hasta que termine el torneo.'}
            </p>
            <p className="final-total-max">Puntos posibles: 22 extra (campeón 10, subcampeón 6, tercero 4, cuarto 2)</p>

            {hasDuplicates && (
              <div className="final-warning">
                ⚠️ Elegiste la misma selección en más de una posición. Podés cambiarlo si querés.
              </div>
            )}

            <div className="final-grid">
              {FINAL_CATEGORIES.map((cat) => (
                <div key={cat.key} className="final-field">
                  <label className="final-label">
                    {cat.label} <span className="final-points">({cat.points} pts)</span>
                  </label>
                  <select
                    value={userFinal[cat.key] || ''}
                    onChange={(e) => onFinalPredict(cat.key, e.target.value)}
                    disabled={finalLocked}
                    className={finalLocked ? 'final-select--locked' : ''}
                  >
                    <option value="">— Sin elegir —</option>
                    {allTeams.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Group matches */}
          {stageData.map((section) => (
            <div key={section.stageName} className="stage-panel">
              <div className="group-header">{section.stageName}</div>
              <div className="match-grid">
                {section.items.map((match) => (
                  <ProdeCard
                    key={match.id}
                    match={match}
                    timezone={timezone}
                    selected={predictions[userName]?.[match.id] ?? null}
                    onPredict={onPredict}
                    disabled={disabled}
                  />
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
