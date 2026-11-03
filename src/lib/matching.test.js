import { describe, it, expect } from 'vitest';
import { rankRecipes, splitIngredients, normalise } from './matching.js';
import { expiryStatus, daysLeft } from './expiry.js';

const today = new Date('2026-11-03T12:00:00');
const meal = (id, name) => ({ idMeal: id, strMeal: name, strMealThumb: '' });

describe('expiry', () => {
  it('buckets days left', () => {
    expect(daysLeft('2026-11-05', today)).toBe(2);
    expect(expiryStatus('2026-11-02', today)).toBe('expired');
    expect(expiryStatus('2026-11-04', today)).toBe('urgent');
    expect(expiryStatus('2026-11-07', today)).toBe('soon');
    expect(expiryStatus('2026-12-01', today)).toBe('fresh');
    expect(expiryStatus(undefined, today)).toBe('fresh');
  });
});

describe('rankRecipes', () => {
  const fridge = [
    { id: 'a', name: 'Chicken', expiry: '2026-11-04' }, // urgent → weight 3
    { id: 'b', name: 'Rice', expiry: '2027-01-01' }, // fresh → 1
    { id: 'c', name: 'Garlic', expiry: '2027-01-01' }, // fresh → 1
  ];

  it('merges per-ingredient results and counts matches', () => {
    const results = {
      a: [meal('1', 'Chicken Rice'), meal('2', 'Roast Chicken')],
      b: [meal('1', 'Chicken Rice'), meal('3', 'Rice Pudding')],
      c: [meal('3', 'Rice Pudding')],
    };
    const ranked = rankRecipes(fridge, results, today);
    expect(ranked.map((r) => r.meal.idMeal)).toEqual(['1', '2', '3']);
    expect(ranked[0].score).toBe(4);
    expect(ranked[0].matchedItems).toHaveLength(2);
    // Roast Chicken (1 urgent item, score 3) beats Rice Pudding (2 fresh items, score 2)
    expect(ranked[1].score).toBe(3);
    expect(ranked[2].score).toBe(2);
  });

  it('treats null API results as empty', () => {
    expect(rankRecipes(fridge, { a: null, b: null, c: null }, today)).toEqual([]);
  });
});

describe('splitIngredients', () => {
  it('separates used and missing ingredients', () => {
    const detail = { strIngredient1: 'Chicken Breast', strMeasure1: '2', strIngredient2: 'Soy Sauce', strIngredient3: '' };
    const { used, missing } = splitIngredients(detail, [{ name: 'chicken' }]);
    expect(used.map((i) => i.name)).toEqual(['Chicken Breast']);
    expect(missing.map((i) => i.name)).toEqual(['Soy Sauce']);
  });
  it('normalises underscores and case', () => {
    expect(normalise(' Chicken_Breast ')).toBe('chicken breast');
  });
});
