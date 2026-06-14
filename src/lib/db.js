import { createClient } from '@supabase/supabase-js';
import { slugify, generatePin } from './session';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
const LS_PREFIX = 'mundial2026_';

function localKey(leagueId) {
  return `${LS_PREFIX}${leagueId}`;
}

function loadLocalState(leagueId) {
  const saved = localStorage.getItem(localKey(leagueId));
  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function saveLocalState(leagueId, state) {
  localStorage.setItem(
    localKey(leagueId),
    JSON.stringify({
      name: state.name || '',
      pin: state.pin || '',
      host: state.host || '',
      members: state.members || [],
      predictions: state.predictions || {},
      finalPredictions: state.finalPredictions || {},
    }),
  );
}

export async function ensureLeague(leagueId, leagueName, hostName) {
  const pin = generatePin();
  if (!supabase) {
    const existing = loadLocalState(leagueId);
    if (!existing) {
      saveLocalState(leagueId, { name: leagueName, pin, host: hostName, members: [hostName], predictions: {} });
    }
    return pin;
  }

  const { error } = await supabase
    .from('leagues')
    .upsert({ id: leagueId, slug: leagueId, name: leagueName, host_name: hostName, pin }, { onConflict: 'id' });
  if (error) {
    console.warn('Supabase ensureLeague failed', error);
  }
  return pin;
}

export async function joinLeague(leagueId, userName) {
  const slug = slugify(userName);
  if (!supabase) {
    const state = loadLocalState(leagueId);
    if (state && !state.members.includes(slug)) {
      state.members.push(slug);
      saveLocalState(leagueId, state);
    }
    return slug;
  }

  const { data, error } = await supabase
    .from('users')
    .upsert({ league_id: leagueId, name: userName, slug }, { onConflict: 'league_id,slug' })
    .select('id,slug')
    .single();

  if (error) {
    console.warn('Supabase joinLeague failed', error);
    return slug;
  }

  return data?.slug || slug;
}

export async function loadLeagueState(leagueId) {
  if (!supabase) {
    const state = loadLocalState(leagueId);
    if (!state) return { members: [], predictions: {}, finalPredictions: {}, host: '', pin: '', name: '' };
    return { members: state.members || [], predictions: state.predictions || {}, finalPredictions: state.finalPredictions || {}, host: state.host || '', pin: state.pin || '', name: state.name || '' };
  }

  const [leaguesResult, usersResult, predictionsResult, finalResult] = await Promise.all([
    supabase.from('leagues').select('host_name,pin,name').eq('id', leagueId).maybeSingle(),
    supabase.from('users').select('id,slug').eq('league_id', leagueId),
    supabase.from('predictions').select('user_id,match_id,outcome').eq('league_id', leagueId),
    supabase.from('final_predictions').select('user_id,category,team').eq('league_id', leagueId),
  ]);

  if (usersResult.error) {
    console.warn('Supabase load users failed', usersResult.error);
    return { members: [], predictions: {}, host: '', pin: '' };
  }

  const members = usersResult.data?.map((item) => item.slug) ?? [];
  const userIdMap = usersResult.data?.reduce((map, user) => {
    map[user.id] = user.slug;
    return map;
  }, {}) || {};

  const predictionMap = {};
  if (predictionsResult.data) {
    predictionsResult.data.forEach((row) => {
      const slug = userIdMap[row.user_id];
      if (!slug) return;
      predictionMap[slug] = {
        ...predictionMap[slug],
        [row.match_id]: row.outcome,
      };
    });
  }

  const finalPredictionMap = {};
  if (finalResult.data) {
    finalResult.data.forEach((row) => {
      const slug = userIdMap[row.user_id];
      if (!slug) return;
      if (!finalPredictionMap[slug]) finalPredictionMap[slug] = {};
      finalPredictionMap[slug][row.category] = row.team;
    });
  }

  return {
    members,
    predictions: predictionMap,
    finalPredictions: finalPredictionMap,
    host: leaguesResult.data?.host_name || '',
    pin: leaguesResult.data?.pin || '',
    name: leaguesResult.data?.name || '',
  };
}

export async function saveFinalPrediction(leagueId, userName, category, team) {
  const slug = slugify(userName);
  if (!supabase) {
    const state = loadLocalState(leagueId);
    if (!state) return;
    if (!state.finalPredictions) state.finalPredictions = {};
    if (!state.finalPredictions[slug]) state.finalPredictions[slug] = {};
    state.finalPredictions[slug][category] = team;
    saveLocalState(leagueId, state);
    return;
  }

  let { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('league_id', leagueId)
    .eq('slug', slug)
    .maybeSingle();

  let userId = user?.id;
  if (!userId) {
    const { data: inserted } = await supabase
      .from('users')
      .insert({ league_id: leagueId, name: userName, slug })
      .select('id')
      .single();
    userId = inserted?.id;
    if (!userId) return;
  }

  await supabase
    .from('final_predictions')
    .upsert(
      { league_id: leagueId, user_id: userId, category, team },
      { onConflict: 'user_id,category' },
    );
}

export async function removeMember(leagueId, userName) {
  const slug = slugify(userName);
  if (!supabase) {
    const state = loadLocalState(leagueId);
    if (!state) return;
    state.members = state.members.filter((m) => m !== slug);
    if (state.predictions[slug]) {
      delete state.predictions[slug];
    }
    saveLocalState(leagueId, state);
    return;
  }

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('league_id', leagueId)
    .eq('slug', slug)
    .maybeSingle();

  if (user) {
    await supabase.from('final_predictions').delete().eq('user_id', user.id);
    await supabase.from('predictions').delete().eq('user_id', user.id);
    await supabase.from('users').delete().eq('id', user.id);
  }
}

export async function doesLeagueExist(leagueId) {
  if (!supabase) {
    return loadLocalState(leagueId) !== null;
  }

  const { data, error } = await supabase
    .from('leagues')
    .select('id')
    .eq('id', leagueId)
    .maybeSingle();

  if (error) {
    console.warn('Supabase doesLeagueExist failed', error);
    return false;
  }

  return Boolean(data?.id);
}

export async function savePrediction(leagueId, userName, matchId, outcome) {
  const slug = slugify(userName);

  if (!supabase) {
    const state = loadLocalState(leagueId);
    if (!state) return;
    if (!state.members.includes(slug)) {
      state.members.push(slug);
    }
    state.predictions[slug] = {
      ...(state.predictions[slug] || {}),
      [matchId]: outcome,
    };
    saveLocalState(leagueId, state);
    return;
  }

  let { data: user, error: userError } = await supabase
    .from('users')
    .select('id,slug')
    .eq('league_id', leagueId)
    .eq('slug', slug)
    .single();

  if (userError) {
    console.warn('Supabase find user failed', userError);
  }

  let userId = user?.id;
  if (!userId) {
    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .insert({ league_id: leagueId, name: userName, slug })
      .select('id')
      .single();

    if (insertError) {
      console.warn('Supabase create user failed', insertError);
      return;
    }

    userId = insertedUser?.id;
  }

  const { error: predictionError } = await supabase
    .from('predictions')
    .upsert(
      { league_id: leagueId, user_id: userId, match_id: matchId, outcome },
      { onConflict: 'user_id,match_id' },
    );

  if (predictionError) {
    console.warn('Supabase savePrediction failed', predictionError);
  }
}
