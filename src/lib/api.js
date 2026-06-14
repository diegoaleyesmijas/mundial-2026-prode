const besoccerEndpoint = 'https://api.besoccer.com/v2';
const apiKey = import.meta.env.VITE_BESOCCER_API_KEY || '';
const footballMatchesEndpoint = '/api/football-data/matches';

// Simple in-memory + localStorage cache to avoid hitting rate limits.
const FOOTBALL_CACHE_KEY = 'mundial2026_football_matches_cache_v2';
let footballCache = { ts: 0, ttl: 0, data: null };
try {
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(FOOTBALL_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.ts && parsed.data) {
        footballCache = parsed;
      }
    }
  }
} catch (e) {
  // ignore storage errors
}

const countryFlagMap = {
  argentina: '🇦🇷',
  algeria: '🇩🇿',
  australia: '🇦🇺',
  austria: '🇦🇹',
  belgium: '🇧🇪',
  'bosnia-herzegovina': '🇧🇦',
  brazil: '🇧🇷',
  canada: '🇨🇦',
  'cape verde islands': '🇨🇻',
  colombia: '🇨🇴',
  'congo dr': '🇨🇩',
  'costa rica': '🇨🇷',
  croatia: '🇭🇷',
  'curaçao': '🇨🇼',
  curacao: '🇨🇼',
  czechia: '🇨🇿',
  denmark: '🇩🇰',
  ecuador: '🇪🇨',
  egypt: '🇪🇬',
  england: '🇬🇧',
  france: '🇫🇷',
  germany: '🇩🇪',
  ghana: '🇬🇭',
  haiti: '🇭🇹',
  iran: '🇮🇷',
  iraq: '🇮🇶',
  'ivory coast': '🇨🇮',
  japan: '🇯🇵',
  jordan: '🇯🇴',
  mexico: '🇲🇽',
  morocco: '🇲🇦',
  netherlands: '🇳🇱',
  'new zealand': '🇳🇿',
  norway: '🇳🇴',
  panama: '🇵🇦',
  portugal: '🇵🇹',
  qatar: '🇶🇦',
  'saudi arabia': '🇸🇦',
  scotland: '🏴',
  senegal: '🇸🇳',
  'south africa': '🇿🇦',
  spain: '🇪🇸',
  sweden: '🇸🇪',
  switzerland: '🇨🇭',
  tunisia: '🇹🇳',
  turkey: '🇹🇷',
  usa: '🇺🇸',
  'united states': '🇺🇸',
  'united states of america': '🇺🇸',
  uruguay: '🇺🇾',
  uzbekistan: '🇺🇿',
  wales: '🏴',
  'south korea': '🇰🇷',
  'korea republic': '🇰🇷',
  poland: '🇵🇱',
  chile: '🇨🇱',
  peru: '🇵🇪',
  china: '🇨🇳',
  paraguay: '🇵🇾',
};

function countryToFlag(code) {
  if (!code || code.length !== 2) {
    return '🏳️';
  }
  return String.fromCodePoint(...code.toUpperCase().split('').map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65));
}

export function getFlagForTeam(teamName) {
  if (!teamName) {
    return '🏳️';
  }

  const normalized = teamName.trim().toLowerCase();
  if (countryFlagMap[normalized]) {
    return countryFlagMap[normalized];
  }

  const words = normalized.split(/[^a-z]+/).filter(Boolean);
  if (words.length === 0) {
    return '🏳️';
  }

  if (words.length === 1) {
    const code = words[0].slice(0, 2).toUpperCase();
    return countryToFlag(code);
  }

  const shortCode = `${words[0][0]}${words[1][0]}`.toUpperCase();
  return countryToFlag(shortCode);
}

function parseGroup(round) {
  if (!round) return null;
  const match = /(?:grupo|group)\s*([a-z0-9])/i.exec(round);
  if (match) {
    return `Grupo ${match[1].toUpperCase()}`;
  }
  return null;
}

function normalizeGroup(rawGroup) {
  if (!rawGroup) return null;
  const group = String(rawGroup).trim();
  const footballDataGroup = /^GROUP_([A-Z0-9])$/i.exec(group);
  if (footballDataGroup) {
    return `Grupo ${footballDataGroup[1].toUpperCase()}`;
  }
  return parseGroup(group);
}

function normalizeRound(rawRound) {
  if (!rawRound) {
    return 'Grupos';
  }

  const round = String(rawRound).trim();
  if (/^GROUP_STAGE$/i.test(round)) return 'Grupos';
  if (/^LAST_16$/i.test(round)) return 'Octavos';
  if (/^QUARTER_FINALS$/i.test(round)) return 'Cuartos';
  if (/^SEMI_FINALS$/i.test(round)) return 'Semifinal';
  if (/final/i.test(round)) return 'Final';
  if (/semi/i.test(round)) return 'Semifinal';
  if (/quarter|cuartos/i.test(round)) return 'Cuartos';
  if (/octavos|round of 16/i.test(round)) return 'Octavos';
  if (/group|grupo/i.test(round)) {
    return round.replace(/group/i, 'Grupo').replace(/grupo/i, 'Grupo');
  }

  return round;
}

function getStadium(item) {
  const stadium = item.venue || item.stadium?.name || item.venue_name || item.stadium;
  const city = item.city || item.city_name || item.venue_city || item.stadium?.city;
  if (stadium && city) {
    return `${stadium} · ${city}`;
  }
  if (stadium) {
    return stadium;
  }
  return 'Pendiente';
}

function getStatusLabel(status) {
  if (status === 'LIVE' || status === 'IN_PLAY') {
    return 'LIVE';
  }
  if (status === 'FINISHED') {
    return 'FINISHED';
  }
  return 'SCHEDULED';
}

export async function fetchFixture() {
  // Use cache if still fresh
  try {
    const now = Date.now();
    if (footballCache && footballCache.ts && footballCache.data && now - footballCache.ts < (footballCache.ttl || 60000)) {
      return footballCache.data;
    }
  } catch (e) {
    // ignore cache read errors
  }

  try {
    const resp = await fetch(footballMatchesEndpoint);

    if (!resp.ok) {
      let message = resp.statusText;
      try {
        const body = await resp.json();
        message = body.message || body.error || message;
      } catch (e) {
        // keep statusText when the API does not return JSON.
      }
      throw new Error(`football-data error ${resp.status}: ${message}`);
    }

    // Inspect rate-limit headers to adjust cache TTL
    const resetHeader = resp.headers.get('X-RequestCounter-Reset');
    const availHeader = resp.headers.get('X-Requests-Available-Minute');
    let ttl = 60000; // default 60s
    try {
      const avail = availHeader ? parseInt(availHeader, 10) : NaN;
      if (!Number.isNaN(avail) && avail < 5) {
        ttl = 120000; // if few requests left, increase cache to 120s
      }
    } catch (e) {
      // ignore parse
    }

    const json = await resp.json();
    const items = (json.matches || []).map(mapToMatchModel);

    // store cache
    try {
      footballCache = { ts: Date.now(), ttl, data: items };
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(FOOTBALL_CACHE_KEY, JSON.stringify(footballCache));
      }
    } catch (e) {
      // ignore storage errors
    }

    // Optionally log rate info for debugging
    if (availHeader || resetHeader) {
      // eslint-disable-next-line no-console
      console.debug('football-data rate:', { avail: availHeader, reset: resetHeader, ttl });
    }

    return items;
  } catch (error) {
    console.error('Error al obtener fixture de football-data.org:', error);
    throw error;
  }
}

export async function fetchTopScorers() {
  if (!apiKey) {
    return [];
  }

  try {
    const response = await fetch(`${besoccerEndpoint}/topscorers?competition=world-cup-2026&limit=15`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    if (!response.ok) {
      throw new Error('Error al obtener goleadores');
    }
    const data = await response.json();
    return (data.topscorers || []).map((item) => ({
      player: item.player?.name || item.player || 'Jugador',
      team: item.team?.name || item.team || 'Equipo',
      goals: item.goals ?? item.scored ?? 0,
      flag: getFlagForTeam(item.team?.name || item.team),
    }));
  } catch (error) {
    console.warn('No se pudo cargar goleadores reales.', error);
    return [];
  }
}

function mapToMatchModel(item) {
  const homeName = item.homeTeam?.name || item.home_team?.name || item.home?.name || item.home || 'Local';
  const awayName = item.awayTeam?.name || item.away_team?.name || item.away?.name || item.away || 'Visitante';
  const rawRound = item.round || item.stage || item.tournament_round || item.round_name || 'Grupos';
  const group = normalizeGroup(item.group) || parseGroup(rawRound) || parseGroup(item.round);
  const round = group || normalizeRound(rawRound);

  return {
    id: String(item.id),
    round,
    group,
    stage: (group || round === 'Grupos') ? 'Grupos' : round,
    home: homeName,
    away: awayName,
    homeFlag: getFlagForTeam(homeName),
    awayFlag: getFlagForTeam(awayName),
    utcDate: item.date || item.utcDate || item.utc_date || item.datetime || null,
    status: getStatusLabel(item.status),
    homeScore:
      item.home_score != null
        ? item.home_score
        : item.score?.fullTime?.home ?? item.score?.fulltime?.home ?? item.score?.full_time?.home ?? null,
    awayScore:
      item.away_score != null
        ? item.away_score
        : item.score?.fullTime?.away ?? item.score?.fulltime?.away ?? item.score?.full_time?.away ?? null,
    venue: getStadium(item),
    broadcast: item.broadcast || item.channel || 'No disponible',
  };
}

export function formatMatchTime(utcDatetime, timezone) {
  const date = new Date(utcDatetime);
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  }).format(date);
}

export function getMatchOutcome(match) {
  if (match.homeScore == null || match.awayScore == null) {
    return null;
  }
  if (match.homeScore > match.awayScore) return 'HOME';
  if (match.homeScore < match.awayScore) return 'AWAY';
  return 'DRAW';
}

export function getOutcomeLabel(outcome) {
  if (outcome === 'HOME') return 'Ganó local';
  if (outcome === 'AWAY') return 'Ganó visitante';
  if (outcome === 'DRAW') return 'Empate';
  return 'Pendiente';
}

export function getMatchResultLabel(match) {
  if (match.homeScore == null || match.awayScore == null) {
    return 'Pendiente';
  }
  return `${match.home} ${match.homeScore} - ${match.awayScore} ${match.away}`;
}

export function computeGroupTables(matches) {
  const groupMatches = matches.filter((match) => match.stage === 'Grupos');
  const groups = {};

  groupMatches.forEach((match) => {
    const groupName = match.group || 'Grupo';
    if (!groups[groupName]) {
      groups[groupName] = {};
    }

    const teamRows = groups[groupName];
    [
      { name: match.home, scored: match.homeScore, conceded: match.awayScore },
      { name: match.away, scored: match.awayScore, conceded: match.homeScore },
    ].forEach((team) => {
      if (!teamRows[team.name]) {
        teamRows[team.name] = {
          name: team.name,
          flag: getFlagForTeam(team.name),
          played: 0,
          won: 0,
          draw: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDiff: 0,
          points: 0,
        };
      }
    });

    if (match.status === 'FINISHED' && match.homeScore != null && match.awayScore != null) {
      const homeRow = teamRows[match.home];
      const awayRow = teamRows[match.away];

      homeRow.played += 1;
      awayRow.played += 1;
      homeRow.goalsFor += match.homeScore;
      homeRow.goalsAgainst += match.awayScore;
      awayRow.goalsFor += match.awayScore;
      awayRow.goalsAgainst += match.homeScore;

      if (match.homeScore > match.awayScore) {
        homeRow.won += 1;
        homeRow.points += 3;
        awayRow.lost += 1;
      } else if (match.homeScore < match.awayScore) {
        awayRow.won += 1;
        awayRow.points += 3;
        homeRow.lost += 1;
      } else {
        homeRow.draw += 1;
        awayRow.draw += 1;
        homeRow.points += 1;
        awayRow.points += 1;
      }
    }
  });

  return Object.entries(groups).map(([name, teams]) => ({
    name,
    teams: Object.values(teams)
      .map((team) => ({
        ...team,
        goalDiff: team.goalsFor - team.goalsAgainst,
      }))
      .sort((a, b) =>
        b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor || a.name.localeCompare(b.name),
      ),
  }));
}

export function isMatchStarted(match) {
  if (match.status === 'LIVE' || match.status === 'FINISHED') return true;
  if (match.status !== 'SCHEDULED') return true;
  try {
    const matchDate = new Date(match.utcDate);
    return Date.now() >= matchDate.getTime();
  } catch {
    return false;
  }
}

export function getAllTeams(matches) {
  const teams = new Set();
  matches.forEach((m) => {
    if (m.home) teams.add(m.home);
    if (m.away) teams.add(m.away);
  });
  return [...teams].sort((a, b) => a.localeCompare(b));
}

export function hasScheduledMatches(matches) {
  return matches.some((m) => m.status === 'SCHEDULED');
}

export function filterMatchesBy(filter, matches) {
  const now = new Date();
  const today = matches.filter((match) => {
    const matchDate = new Date(match.utcDate);
    return (
      matchDate.getFullYear() === now.getFullYear() &&
      matchDate.getMonth() === now.getMonth() &&
      matchDate.getDate() === now.getDate()
    );
  });

  if (filter === 'TODAY') {
    return today;
  }

  if (filter === 'GROUPS') {
    return matches.filter((match) => match.stage === 'Grupos');
  }

  if (filter === 'KNOCKOUT') {
    return matches.filter((match) => match.stage !== 'Grupos');
  }

  return matches;
}
