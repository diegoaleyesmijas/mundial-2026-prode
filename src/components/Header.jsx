import { useState } from 'react';
import Logo from './Logo';

const tabs = [
  { id: 'PRODE', label: '🎯 Prode' },
  { id: 'FIXTURE', label: '📅 Fixture' },
  { id: 'RANKING', label: '🏆 Ranking' },
];

export default function Header({
  userName,
  leagueName,
  activeTab,
  onTabChange,
  leagueId,
  leagueExists,
  userBadge,
  isHost,
  adminVerified,
  onAdminLogin,
  leaguePin,
}) {
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [adminPinValue, setAdminPinValue] = useState('');
  const [adminPinError, setAdminPinError] = useState('');

  function handleAdminVerify() {
    if (adminPinValue === leaguePin) {
      onAdminLogin(true);
      setShowAdminPin(false);
      setAdminPinValue('');
      setAdminPinError('');
    } else {
      setAdminPinError('PIN incorrecto');
    }
  }

  return (
    <header className="app-header">
      <div className="header-top">
        <div className="logo"><Logo size={44} /></div>
        <div>
          <div className="header-title">
            Prode <span>Mundial 2026</span>
          </div>
          <div className="header-sub">
            {leagueName || 'Prode social'}
          </div>
        </div>
        {leagueId && leagueExists && (
          <>
            {!adminVerified && (
              <div className="admin-header-login">
                {!showAdminPin ? (
                  <button
                    type="button"
                    className="btn-admin-login"
                    onClick={() => setShowAdminPin(true)}
                    title="Acceder como administrador"
                  >
                    🔐
                  </button>
                ) : (
                  <div className="admin-pin-inline">
                    <input
                      type="password"
                      maxLength={4}
                      inputMode="numeric"
                      placeholder="PIN"
                      value={adminPinValue}
                      onChange={(e) => { setAdminPinValue(e.target.value); setAdminPinError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleAdminVerify()}
                      className={adminPinError ? 'input-error' : ''}
                      autoFocus
                    />
                    <button type="button" className="btn-pin-verify" onClick={handleAdminVerify}>
                      OK
                    </button>
                    <button type="button" className="btn-pin-cancel" onClick={() => { setShowAdminPin(false); setAdminPinValue(''); setAdminPinError(''); }}>
                      ✕
                    </button>
                  </div>
                )}
                {adminPinError && <span className="admin-pin-error">{adminPinError}</span>}
              </div>
            )}
            {adminVerified && (
              <span className="admin-verified-badge" title="Admin verificado">👑</span>
            )}
            <div className="user-badge">{userBadge}</div>
          </>
        )}
      </div>

      {leagueId && leagueExists && (
        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
