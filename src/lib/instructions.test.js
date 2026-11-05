import { describe, it, expect } from 'vitest';
import { splitInstructions } from './instructions.js';

/** Every step must be an exact excerpt of the original: nothing reworded. */
function expectVerbatim(original, steps) {
  for (const step of steps) expect(original).toContain(step);
}

describe('splitInstructions', () => {
  it('returns [] for empty input', () => {
    expect(splitInstructions('')).toEqual([]);
    expect(splitInstructions(null)).toEqual([]);
    expect(splitInstructions('  \r\n ')).toEqual([]);
  });

  it('splits on line breaks and drops blank lines', () => {
    const text = 'Heat the oil.\r\n\r\nAdd the onion and cook for 5 minutes.\r\nServe hot.';
    const steps = splitInstructions(text);
    expect(steps).toEqual(['Heat the oil.', 'Add the onion and cook for 5 minutes.', 'Serve hot.']);
    expectVerbatim(text, steps);
  });

  it('drops label-only lines like "STEP 1"', () => {
    const text = 'STEP 1\r\nBoil the pasta.\r\nSTEP 2\r\nDrain and toss with sauce.';
    expect(splitInstructions(text)).toEqual(['Boil the pasta.', 'Drain and toss with sauce.']);
  });

  it('strips leading step labels but keeps the rest verbatim', () => {
    const text = '1. Preheat the oven to 200C.\n2) Roast for 20 mins.\nStep 3: Rest, then slice.\nSTEP 4 - Serve.';
    const steps = splitInstructions(text);
    expect(steps).toEqual(['Preheat the oven to 200C.', 'Roast for 20 mins.', 'Rest, then slice.', 'Serve.']);
    expectVerbatim(text, steps);
  });

  it('does not treat a leading quantity as a label', () => {
    expect(splitInstructions('2 eggs go in first.\n3 cups of flour next.')).toEqual([
      '2 eggs go in first.',
      '3 cups of flour next.',
    ]);
  });

  it('splits a single paragraph into sentences', () => {
    const text = 'Prep the vegetables. Cook them over medium heat until soft! Season to taste. Serve.';
    const steps = splitInstructions(text);
    expect(steps).toEqual(['Prep the vegetables.', 'Cook them over medium heat until soft!', 'Season to taste.', 'Serve.']);
    expectVerbatim(text, steps);
  });

  it('splits long paragraphs into sentences but keeps short ones whole', () => {
    const long =
      'Put the chicken in a large bowl with the yogurt, garlic and spices. Mix well and leave to marinate for at least an hour. Thread onto skewers and grill until charred.';
    const text = `Soak the skewers. Light the grill.\n${long}`;
    const steps = splitInstructions(text);
    expect(steps[0]).toBe('Soak the skewers. Light the grill.');
    expect(steps.slice(1)).toHaveLength(3);
    expectVerbatim(text, steps);
  });

  it('does not split inside numbers like 1.5', () => {
    expect(splitInstructions('Add 1.5 cups of stock. Simmer.')).toEqual(['Add 1.5 cups of stock.', 'Simmer.']);
  });
});
