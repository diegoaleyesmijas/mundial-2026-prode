import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import LeagueSetup from './components/LeagueSetup';
import Fixture from './components/Fixture';
import Prode from './components/Prode';
import Ranking from './components/Ranking';
import AdminPanel from './components/AdminPanel';
import { buildLeagueLink, parseLeaguePath, slugify, uniqueLeagueId, getSessionUser, setSessionUser, clearSessionUser, getAdminSession, setAdminSession } from './lib/session';
import { computeLeagueRanking, computeFinalPredictionPoints } from './lib/ranking';
import { fetchFixture, fetchTopScorers, computeGroupTables, getAllTeams } from './lib/api';
import {
  ensureLeague,
  joinLeague,
  loadLeagueState,
  savePrediction,
  doesLeagueExist,
  removeMember,
  saveFinalPrediction,
} from './lib/db';

export default function App() {
  const [leagueId, setLeagueId] = useState(null);
  const [leagueName, setLeagueName] = useState('');
  const [userName, setUserName] = useState('');
  const [setupLoading, setSetupLoading] = useState(true);
  const [draftLeagueName, setDraftLeagueName] = useState('');
  const [draftName, setDraftName] = useState('');
  const [draftPin, setDraftPin] = useState('');
  const [hostName, setHostName] = useState('');
  const [leaguePin, setLeaguePin] = useState('');
  const [matches, setMatches] = useState([]);
  const [members, setMembers] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [finalPredictions, setFinalPredictions] = useState({});
  const [filter, setFilter] = useState('TODAY');
  const [loading, setLoading] = useState(false);
  const [leagueExists, setLeagueExists] = useState(null);
  const [infoMessage, setInfoMessage] = useState('');
  const [pinError, setPinError] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [groupTables, setGroupTables] = useState([]);
  const [topScorers, setTopScorers] = useState([]);
  const [adminVerified, setAdminVerified] = useState(false);
  const [apiError, setApiError] = useState(null);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [activeTab, setActiveTab] = useState('PRODE');

  // Step 1: Parse URL, extract leagueId only — DO NOT set userName from URL
  useEffect(() => {
    const { league } = parseLeaguePath(window.location.pathname);
    if (league) setLeagueId(league);
  }, []);

  // Step 2: Validate league + load state → determine if session user can auto-login
  useEffect(() => {
    if (!leagueId) {
      setSetupLoading(false);
      return;
    }
    let active = true;
    async function validate() {
      const exists = await doesLeagueExist(leagueId);
      if (!active) return;
      setLeagueExists(exists);
      if (!exists) {
        setInfoMessage('Esta liga no existe.');
        setSetupLoading(false);
        return;
      }
      const state = await loadLeagueState(leagueId);
      if (!active) return;
      setLeagueName(state.name || '');
      setHostName(state.host || '');
      setLeaguePin(state.pin || '');
      setMembers(state.members || []);
      setPredictions(state.predictions || {});
      setFinalPredictions(state.finalPredictions || {});

      // Check session: is there a stored user for this league?
      const sessionUser = getSessionUser(leagueId);
      const memberList = state.members || [];

      if (sessionUser && memberList.includes(sessionUser)) {
        // Session user IS a member → auto-login
        setUserName(sessionUser);
        window.history.replaceState(null, '', `/liga/${leagueId}/${sessionUser}`);
      }

      // Restore admin session
      if (getAdminSession(leagueId)) {
        setAdminVerified(true);
      }

      setSetupLoading(false);
    }
    validate();
    return () => { active = false; };
  }, [leagueId]);

  useEffect(() => {
    let active = true;
    let retryCount = 0;
    async function refresh() {
      try {
        setLoading(true);
        setApiError(null);
        const liveMatches = await fetchFixture();
        if (!active) return;
        setMatches(liveMatches);
        setGroupTables(computeGroupTables(liveMatches));
        const scorers = await fetchTopScorers();
        if (!active) return;
        setTopScorers(scorers);
      } catch (e) {
        if (!active) return;
        const msg = e instanceof Error ? e.message : String(e);
        setApiError(msg);
        console.error('Error al refrescar datos:', msg);
      } finally {
        if (active) setLoading(false);
      }
    }
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  function handleRetry() {
    setApiError(null);
    setLoading(true);
    (async () => {
      try {
        const liveMatches = await fetchFixture();
        setMatches(liveMatches);
        setGroupTables(computeGroupTables(liveMatches));
        const scorers = await fetchTopScorers();
        setTopScorers(scorers);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setApiError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }

  const allTeams = useMemo(() => getAllTeams(matches), [matches]);
  const finalLocked = useMemo(
    () => matches.some((m) => m.status === 'LIVE' || m.status === 'FINISHED'),
    [matches],
  );
  const finalPointsMap = useMemo(
    () => computeFinalPredictionPoints(finalPredictions, members),
    [finalPredictions, members],
  );

  const isHost = Boolean(hostName && userName && hostName === userName);
  const canAdmin = isHost || adminVerified;

  const userBadge = userName || 'Invitado';

  const leagueLink = useMemo(() => {
    if (!leagueId || leagueExists === false) return '';
    return buildLeagueLink(leagueId, userName);
  }, [leagueId, userName, leagueExists]);

  const visibleMatches = useMemo(() => {
    if (filter === 'TODAY') {
      const now = new Date();
      return matches.filter((match) => {
        const d = new Date(match.utcDate);
        return d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate();
      });
    }
    if (filter === 'GROUPS') return matches.filter((m) => m.stage === 'Grupos');
    if (filter === 'KNOCKOUT') return matches.filter((m) => m.stage !== 'Grupos');
    return matches;
  }, [filter, matches]);

  const ranking = useMemo(
    () => computeLeagueRanking(matches, predictions, members),
    [matches, predictions, members],
  );

  const participantRows = useMemo(() => {
    const rankMap = ranking.reduce((map, e) => {
      map[e.member] = e;
      return map;
    }, {});
    return members
      .map((member) => {
        const mp = predictions[member] || {};
        const re = rankMap[member] || { points: 0, correct: 0 };
        const fp = finalPointsMap?.[member];
        return {
          member,
          predictionsCount: Object.keys(mp).length,
          correct: re.correct,
          points: re.points,
          finalPoints: fp?.points || 0,
        };
      })
      .sort((a, b) => {
        const totalA = a.points + a.finalPoints;
        const totalB = b.points + b.finalPoints;
        return totalB - totalA || b.correct - a.correct || a.member.localeCompare(b.member);
      });
  }, [members, predictions, ranking, finalPointsMap]);

  const isLeagueReady = Boolean(userName && leagueId && leagueExists === true);

  function getSetupMode() {
    if (setupLoading) return 'loading';
    if (!leagueId) return 'create';
    if (leagueId && !userName) return 'join';
    return null;
  }

  async function handleCreateLeague() {
    if (!draftLeagueName.trim()) {
      setInfoMessage('El nombre de la competencia es obligatorio.');
      return;
    }
    if (!draftName.trim()) {
      setInfoMessage('Tu nombre o apodo es obligatorio.');
      return;
    }
    const cleanName = slugify(draftName);
    const league = uniqueLeagueId();
    const pin = await ensureLeague(league, draftLeagueName.trim(), cleanName);
    await joinLeague(league, cleanName);
    setSessionUser(league, cleanName);
    window.history.replaceState(null, '', `/liga/${league}/${cleanName}`);
    setLeagueId(league);
    setLeagueName(draftLeagueName.trim());
    setUserName(cleanName);
    setHostName(cleanName);
    setLeaguePin(pin);
    setLeagueExists(true);
    setMembers([cleanName]);
    setPredictions({});
    setFinalPredictions({});
    setInfoMessage('');
    setPinError('');
    setDraftPin('');
  }

  async function handleJoinLeague() {
    if (!draftName.trim() || !leagueId) {
      setInfoMessage('Ingresá tu nombre o apodo.');
      return;
    }
    if (!draftPin || draftPin !== leaguePin) {
      setPinError('PIN incorrecto. Verificá con quien creó la liga.');
      return;
    }
    setPinError('');
    const cleanName = slugify(draftName);
    await joinLeague(leagueId, cleanName);
    setSessionUser(leagueId, cleanName);
    window.history.replaceState(null, '', `/liga/${leagueId}/${cleanName}`);
    setUserName(cleanName);
    setLeagueExists(true);
    setMembers((prev) => (prev.includes(cleanName) ? prev : [...prev, cleanName]));
    setInfoMessage('');
    setDraftPin('');
  }

  function handlePrediction(matchId, outcome) {
    if (!userName) {
      setInfoMessage('Debés tener un nombre para registrar pronósticos.');
      return;
    }
    const updated = {
      ...predictions,
      [userName]: { ...predictions[userName], [matchId]: outcome },
    };
    setPredictions(updated);
    savePrediction(leagueId, userName, matchId, outcome);
  }

  function handleFinalPredict(category, team) {
    if (!userName) return;
    const updated = {
      ...finalPredictions,
      [userName]: { ...(finalPredictions[userName] || {}), [category]: team || '' },
    };
    setFinalPredictions(updated);
    if (team) {
      saveFinalPrediction(leagueId, userName, category, team);
    }
  }

  function handleCopyLink() {
    if (!leagueLink) return;
    navigator.clipboard.writeText(leagueLink);
    setCopyMessage('Enlace copiado');
    setTimeout(() => setCopyMessage(''), 1800);
  }

  function handleCopyPin() {
    if (!leaguePin) return;
    navigator.clipboard.writeText(leaguePin);
    setCopyMessage('PIN copiado');
    setTimeout(() => setCopyMessage(''), 1800);
  }

  async function handleAddMember(name) {
    if (!name.trim() || !leagueId) return;
    const cleanName = slugify(name);
    await joinLeague(leagueId, cleanName);
    setMembers((prev) => (prev.includes(cleanName) ? prev : [...prev, cleanName]));
  }

  async function handleRemoveMember(name) {
    if (!name || !leagueId) return;
    const cleanName = slugify(name);
    await removeMember(leagueId, cleanName);
    setMembers((prev) => prev.filter((m) => m !== cleanName));
    setPredictions((prev) => {
      const copy = { ...prev };
      delete copy[cleanName];
      return copy;
    });
    setFinalPredictions((prev) => {
      const copy = { ...prev };
      delete copy[cleanName];
      return copy;
    });
  }

  function handleLeaveLeague() {
    if (!leagueId || !userName) return;
    if (!confirm('¿Estás seguro de que querés salir de la liga? Tus pronósticos se borrarán.')) return;
    clearSessionUser(leagueId);
    setUserName('');
    setMembers((prev) => prev.filter((m) => m !== userName));
    setPredictions((prev) => {
      const copy = { ...prev };
      delete copy[userName];
      return copy;
    });
    setFinalPredictions((prev) => {
      const copy = { ...prev };
      delete copy[userName];
      return copy;
    });
    window.history.replaceState(null, '', `/liga/${leagueId}`);
  }

  function handleAdminLogin(verified) {
    if (verified) {
      setAdminVerified(true);
      setAdminSession(leagueId);
    }
  }

  const setupMode = getSetupMode();

  return (
    <div className="app-shell">
      <Header
        userName={userName}
        leagueName={leagueName}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        leagueId={leagueId}
        leagueExists={leagueExists === true}
        userBadge={userBadge}
        isHost={isHost}
        adminVerified={adminVerified}
        onAdminLogin={handleAdminLogin}
        leaguePin={leaguePin}
      />

      <main className="content">
        {setupMode && (
          <LeagueSetup
            mode={setupMode}
            leagueName={leagueName}
            draftLeagueName={draftLeagueName}
            draftName={draftName}
            draftPin={draftPin}
            pinError={setupMode === 'join' ? pinError : ''}
            infoMessage={infoMessage}
            onDraftLeagueNameChange={setDraftLeagueName}
            onDraftNameChange={setDraftName}
            onDraftPinChange={setDraftPin}
            onCreateLeague={handleCreateLeague}
            onJoinLeague={handleJoinLeague}
          />
        )}

        {isLeagueReady && (
          <section className="panel panel-share">
            <div className="panel-header">
              <div className="panel-header-info">
                <span className="panel-tag">{leagueName || 'Liga privada'}</span>
                <h2>Hola, {userName} {isHost ? '👑' : ''}</h2>
                <p>Compartí el enlace y el PIN para invitar más participantes.</p>
              </div>
            </div>

            <div className="share-row">
              <div className="share-field">
                <label className="share-label">Enlace de la liga</label>
                <div className="share-input-row">
                  <input value={leagueLink} readOnly aria-label="Enlace de liga" />
                  <button className="btn btn-secondary" type="button" onClick={handleCopyLink}>
                    Copiar
                  </button>
                </div>
              </div>

              <div className="share-field">
                <label className="share-label">PIN de la liga</label>
                <div className="share-input-row">
                  <input value={leaguePin} readOnly aria-label="PIN de liga" className="pin-input" />
                  <button className="btn btn-secondary" type="button" onClick={handleCopyPin}>
                    Copiar
                  </button>
                </div>
              </div>
            </div>

            <p className="pin-hint">Compartí el ENLACE y el PIN con tus amigos. Necesitan ambos para unirse.</p>

            {copyMessage && <p className="copy-note">{copyMessage}</p>}

            {members.length > 0 && (
              <div className="members-grid">
                <span className="member-pill member-pill--title">Participantes:</span>
                {members.map((member) => (
                  <span key={member} className={`member-pill ${member === userName ? 'member-pill--me' : ''}`}>
                    {member} {member === hostName ? '👑' : ''}
                  </span>
                ))}
              </div>
            )}

            <div className="leave-section">
              <button className="btn btn-leave" type="button" onClick={handleLeaveLeague}>
                Salir de la liga
              </button>
            </div>
          </section>
        )}

        {isLeagueReady && (
          <>
            <Prode
              active={activeTab === 'PRODE'}
              matches={matches}
              predictions={predictions}
              finalPredictions={finalPredictions}
              allTeams={allTeams}
              userName={userName}
              onPredict={handlePrediction}
              onFinalPredict={handleFinalPredict}
              timezone={timezone}
              disabled={false}
              loading={loading}
              apiError={apiError}
              onRetry={handleRetry}
              finalLocked={finalLocked}
              leagueId={leagueId}
            />

            <Fixture
              active={activeTab === 'FIXTURE'}
              matches={visibleMatches}
              filter={filter}
              onFilterChange={setFilter}
              groupTables={groupTables}
              topScorers={topScorers}
              loading={loading}
              timezone={timezone}
            />

            <Ranking
              active={activeTab === 'RANKING'}
              participantRows={participantRows}
              finalPointsMap={finalPointsMap}
              userName={userName}
              leagueLink={leagueLink}
              onCopyLink={handleCopyLink}
              copyMessage={copyMessage}
            />

            {(isHost || adminVerified) && (
              <AdminPanel
                isAdmin={isHost}
                adminVerified={adminVerified}
                members={members}
                predictions={predictions}
                matches={matches}
                userName={userName}
                leagueId={leagueId}
                onAddMember={handleAddMember}
                onRemoveMember={handleRemoveMember}
                leaguePin={leaguePin}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
