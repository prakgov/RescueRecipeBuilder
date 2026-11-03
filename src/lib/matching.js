import { expiryWeight, expiryStatus } from './expiry.js';

/** Normalise an ingredient name for comparison: lowercase, trimmed, single spaces. */
export function normalise(name) {
  return String(name || '').toLowerCase().trim().replace(/[_\s]+/g, ' ');
}

/**
 * Step 2 + 3 of the matching algorithm.
 *
 * TheMealDB's free tier can only filter by ONE ingredient, so we call
 * filter.php once per fridge item and merge the lists here.
 *
 * @param {Array<{id:string,name:string,expiry?:string}>} fridge
 * @param {Record<string, Array<{idMeal,strMeal,strMealThumb}>|null>} resultsByItemId
 *        filter.php results keyed by fridge item id (null = no recipes for that item)
 * @returns ranked array of { meal, matchedItems, score, urgentCount }
 */
export function rankRecipes(fridge, resultsByItemId, today = new Date()) {
  const byMeal = new Map();

  for (const item of fridge) {
    const meals = resultsByItemId[item.id] || []; // API returns null for "no results"
    const weight = expiryWeight(item.expiry, today);
    const status = expiryStatus(item.expiry, today);

    for (const meal of meals) {
      let entry = byMeal.get(meal.idMeal);
      if (!entry) {
        entry = { meal, matchedItems: [], score: 0, urgentCount: 0 };
        byMeal.set(meal.idMeal, entry);
      }
      // Guard against the same fridge ingredient being added twice
      if (entry.matchedItems.some((m) => normalise(m.name) === normalise(item.name))) continue;
      entry.matchedItems.push(item);
      entry.score += weight;
      if (status === 'urgent' || status === 'expired') entry.urgentCount += 1;
    }
  }

  return [...byMeal.values()].sort(
    (a, b) =>
      b.score - a.score ||
      b.matchedItems.length - a.matchedItems.length ||
      a.meal.strMeal.localeCompare(b.meal.strMeal),
  );
}

/** Pull the 20 strIngredientN / strMeasureN pairs out of a lookup.php meal. */
export function extractIngredients(mealDetail) {
  const list = [];
  for (let i = 1; i <= 20; i++) {
    const name = mealDetail?.[`strIngredient${i}`];
    if (name && name.trim()) {
      list.push({ name: name.trim(), measure: (mealDetail[`strMeasure${i}`] || '').trim() });
    }
  }
  return list;
}

/** Does a recipe ingredient correspond to something in the fridge? */
export function inFridge(ingredientName, fridge) {
  const n = normalise(ingredientName);
  return fridge.some((item) => {
    const f = normalise(item.name);
    return f === n || n.includes(f) || f.includes(n);
  });
}

/** Split a full recipe's ingredients into "you have" and "you're missing". */
export function splitIngredients(mealDetail, fridge) {
  const used = [];
  const missing = [];
  for (const ing of extractIngredients(mealDetail)) {
    (inFridge(ing.name, fridge) ? used : missing).push(ing);
  }
  return { used, missing };
}
