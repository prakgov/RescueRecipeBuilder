/**
 * Turn a recipe's free-text instructions into short checklist steps
 * WITHOUT rewriting them: every returned step is an exact excerpt of the
 * original text. We only split it up and drop the recipe's own step labels
 * ("STEP 1", "1.", "Step 2:"), because the checklist numbers steps itself.
 */

// A line that is only a label, e.g. "STEP 1", "Step 2:", "3." or "4)"
const LABEL_ONLY = /^(?:step\s*)?\d+\s*[.:)\-–]?$/i;
// A label at the start of a line, e.g. "STEP 1 - ", "Step 2: ", "3. ", "4) "
const LABEL_PREFIX = /^(?:step\s*\d+\s*[.:)\-–]?|\d+\s*[.:)\-–])\s+/i;
// Sentence boundary: . ! or ? followed by space(s) and a capital letter or digit
const SENTENCE_BREAK = /(?<=[.!?])\s+(?=[A-Z0-9])/;
// Paragraphs longer than this are split into sentences to keep steps short
const LONG_PARAGRAPH = 140;

export function splitInstructions(text) {
  if (!text || !text.trim()) return [];

  const paragraphs = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !LABEL_ONLY.test(line))
    .map((line) => line.replace(LABEL_PREFIX, ''))
    .filter(Boolean);

  // One long block (common in TheMealDB) or long paragraphs → sentences
  return paragraphs.flatMap((p) =>
    p.length > LONG_PARAGRAPH || paragraphs.length === 1
      ? p.split(SENTENCE_BREAK).map((s) => s.trim()).filter(Boolean)
      : [p],
  );
}
