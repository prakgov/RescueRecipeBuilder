import { SAMPLE_MEALS, SAMPLE_INGREDIENTS } from '../data/sampleMeals.js';
import { normalise } from '../lib/matching.js';

// Public test key "1" — free, no signup, safe to ship in a static site.
const BASE = 'https://www.themealdb.com/api/json/v1/1';
const CACHE_PREFIX = 'fs-cache:';
const TTL_MS = 24 * 60 * 60 * 1000; // 1 day: the shared test key may be rate-limited

/** Set to true the first time the live API fails, so the UI can show a banner. */
export const apiState = { offline: false, listeners: new Set() };
function markOffline() {
  if (!apiState.offline) {
    apiState.offline = true;
    apiState.listeners.forEach((fn) => fn(true));
  }
}

function readCache(key) {
  try {
    const hit = JSON.parse(localStorage.getItem(CACHE_PREFIX + key));
    if (hit && Date.now() - hit.t < TTL_MS) return hit.v;
  } catch {
    /* corrupt or unavailable storage: ignore */
  }
  return undefined;
}

function writeCache(key, value) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ t: Date.now(), v: value }));
  } catch {
    /* quota full: caching is best-effort */
  }
}

/** Fetch JSON with a localStorage cache. Throws on network/HTTP errors. */
async function getJSON(path) {
  const cached = readCache(path);
  if (cached !== undefined) return cached;
  const res = await fetch(`${BASE}/${path}`);
  if (!res.ok) throw new Error(`TheMealDB ${res.status}`);
  const data = await res.json();
  writeCache(path, data);
  return data;
}

/** All ingredient names, for the autocomplete. */
export async function listIngredients() {
  try {
    const data = await getJSON('list.php?i=list');
    return (data.meals || []).map((m) => m.strIngredient).filter(Boolean).sort();
  } catch {
    markOffline();
    return SAMPLE_INGREDIENTS;
  }
}

/**
 * Recipes containing ONE ingredient. Returns [] when none
 * (the API returns { meals: null } rather than an error for empty results).
 */
export async function filterByIngredient(name) {
  const q = encodeURIComponent(name.trim().replace(/\s+/g, '_'));
  try {
    const data = await getJSON(`filter.php?i=${q}`);
    return data.meals || [];
  } catch {
    markOffline();
    const n = normalise(name);
    return SAMPLE_MEALS.filter((m) =>
      Object.keys(m).some((k) => k.startsWith('strIngredient') && normalise(m[k]).includes(n)),
    ).map(({ idMeal, strMeal, strMealThumb }) => ({ idMeal, strMeal, strMealThumb }));
  }
}

/** Full recipe details for one meal id. */
export async function lookupMeal(id) {
  if (String(id).startsWith('s')) return SAMPLE_MEALS.find((m) => m.idMeal === id) || null;
  try {
    const data = await getJSON(`lookup.php?i=${encodeURIComponent(id)}`);
    return data.meals?.[0] || null;
  } catch {
    markOffline();
    return null;
  }
}
