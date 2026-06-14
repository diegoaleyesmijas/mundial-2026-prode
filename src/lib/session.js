export function parseLeaguePath(pathname) {
  const pathParts = pathname.split('/').filter(Boolean);
  if (pathParts[0] !== 'liga') {
    return { league: null, user: null };
  }
  return {
    league: pathParts[1] || null,
    user: pathParts[2] || null,
  };
}

export function uniqueLeagueId() {
  return `liga-${Math.random().toString(36).slice(2, 9)}`;
}

export function generatePin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 20);
}

export function buildLeagueLink(leagueId) {
  return `${window.location.origin}/liga/${leagueId}`;
}

const SESSION_PREFIX = 'mundial2026_session_';

export function getSessionUser(leagueId) {
  try {
    return localStorage.getItem(`${SESSION_PREFIX}${leagueId}`) || null;
  } catch {
    return null;
  }
}

export function setSessionUser(leagueId, userName) {
  try {
    localStorage.setItem(`${SESSION_PREFIX}${leagueId}`, slugify(userName));
  } catch {
    // ignore
  }
}

export function clearSessionUser(leagueId) {
  try {
    localStorage.removeItem(`${SESSION_PREFIX}${leagueId}`);
  } catch {
    // ignore
  }
}

const ADMIN_PREFIX = 'mundial2026_admin_';

export function getAdminSession(leagueId) {
  try {
    return localStorage.getItem(`${ADMIN_PREFIX}${leagueId}`) === 'true';
  } catch {
    return false;
  }
}

export function setAdminSession(leagueId) {
  try {
    localStorage.setItem(`${ADMIN_PREFIX}${leagueId}`, 'true');
  } catch {
    // ignore
  }
}

export function clearAdminSession(leagueId) {
  try {
    localStorage.removeItem(`${ADMIN_PREFIX}${leagueId}`);
  } catch {
    // ignore
  }
}
