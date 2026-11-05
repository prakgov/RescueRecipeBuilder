import { useMemo, useState } from 'react';
import { Form, ProgressBar, Button, ListGroup } from 'react-bootstrap';
import { splitInstructions } from '../lib/instructions.js';

/**
 * Recipe instructions as a numbered, tickable checklist.
 * Step text comes verbatim from the recipe (see splitInstructions);
 * the untouched original is one click away.
 * Mount with key={mealId} so ticks reset for each recipe.
 */
export default function InstructionChecklist({ text }) {
  const steps = useMemo(() => splitInstructions(text), [text]);
  const [done, setDone] = useState(() => new Set());
  const [showOriginal, setShowOriginal] = useState(false);

  if (steps.length === 0) return <p className="small text-muted">No instructions provided for this recipe.</p>;

  const toggle = (i) =>
    setDone((d) => {
      const next = new Set(d);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const allDone = done.size === steps.length;

  return (
    <section aria-labelledby="steps-heading">
      <div className="d-flex justify-content-between align-items-baseline gap-2 mb-1">
        <h3 id="steps-heading" className="h6 mb-0">
          Steps <span className="text-muted fw-normal">· {steps.length}</span>
        </h3>
        <small className={allDone ? 'text-success fw-semibold' : 'text-muted'} aria-live="polite">
          {allDone ? 'All done ✓' : `${done.size} / ${steps.length} done`}
        </small>
      </div>
      <ProgressBar
        now={(done.size / steps.length) * 100}
        variant="success"
        className="mb-2"
        style={{ height: 4 }}
        aria-label="Steps completed"
      />

      <ListGroup as="ol" variant="flush" className="step-list mb-2">
        {steps.map((step, i) => (
          <ListGroup.Item as="li" key={i} className="px-0 py-1 border-0">
            <Form.Check
              id={`step-${i}`}
              className={`small step-check${done.has(i) ? ' is-done' : ''}`}
              checked={done.has(i)}
              onChange={() => toggle(i)}
              label={
                <>
                  <span className="step-num">{i + 1}.</span> {step}
                </>
              }
            />
          </ListGroup.Item>
        ))}
      </ListGroup>

      <div className="d-flex gap-3 small">
        {done.size > 0 && (
          <Button variant="link" size="sm" className="p-0" onClick={() => setDone(new Set())}>
            Reset ticks
          </Button>
        )}
        <Button variant="link" size="sm" className="p-0" onClick={() => setShowOriginal((s) => !s)} aria-expanded={showOriginal}>
          {showOriginal ? 'Hide original text' : 'Show original text'}
        </Button>
      </div>
      {showOriginal && (
        <p className="small text-muted border-start ps-2 mt-2" style={{ whiteSpace: 'pre-line' }}>
          {text}
        </p>
      )}
    </section>
  );
}
