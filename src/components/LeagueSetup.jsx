

export default function LeagueSetup({
  mode,
  leagueName,
  draftLeagueName,
  draftName,
  draftPin,
  pinError,
  infoMessage,
  onDraftLeagueNameChange,
  onDraftNameChange,
  onDraftPinChange,
  onCreateLeague,
  onJoinLeague,
}) {
  if (mode === 'loading') {
    return (
      <section className="panel panel--compact">
        <h2>Cargando...</h2>
        <p>Verificando enlace...</p>
      </section>
    );
  }

  if (mode === 'create') {
    return (
      <section className="panel panel--compact" style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <img src="/assets/copa-mundial.png" alt="Mundial 2026" height="80" />
        </div>
        <div className="panel-tag">Nueva competencia</div>
        <h2>Armá tu prode privado</h2>
        <p>Creá una competencia para tu curso, club, oficina o grupo de amigos.</p>
        <div className="form-row">
          <div className="field-group">
            <input
              value={draftLeagueName}
              onChange={(e) => onDraftLeagueNameChange(e.target.value)}
              placeholder="Competencia / Organización"
            />
            <input
              value={draftName}
              onChange={(e) => onDraftNameChange(e.target.value)}
              placeholder="Tu nombre o apodo"
            />
          </div>
          <button className="btn btn-primary" onClick={onCreateLeague}>
            Crear liga
          </button>
        </div>
        {infoMessage && <p className="help-text">{infoMessage}</p>}
      </section>
    );
  }

  if (mode === 'join') {
    return (
      <section className="panel panel--compact" style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <img src="/assets/copa-mundial.png" alt="Mundial 2026" height="80" />
        </div>
        <div className="panel-tag">Unirse a competencia</div>
        {leagueName && <h2>{leagueName}</h2>}
        <p>Ingresá tu nombre y el PIN que te compartieron para participar.</p>
        <div className="form-row">
          <div className="field-group">
            <input
              value={draftName}
              onChange={(e) => onDraftNameChange(e.target.value)}
              placeholder="Tu nombre o apodo"
            />
            <input
              value={draftPin}
              onChange={(e) => onDraftPinChange(e.target.value)}
              placeholder="PIN de la liga"
              type="password"
              maxLength={4}
              inputMode="numeric"
              className={pinError ? 'input-error' : ''}
            />
            {pinError && <p className="field-error">{pinError}</p>}
          </div>
          <button className="btn btn-primary" onClick={onJoinLeague}>
            Unirme a la liga
          </button>
        </div>
        {infoMessage && <p className="help-text">{infoMessage}</p>}
      </section>
    );
  }

  return null;
}
