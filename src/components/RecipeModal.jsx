import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal, Button, Spinner, Row, Col, Form, Badge } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { lookupMeal } from '../api/mealdb.js';
import { useFridge } from '../context/FridgeContext.jsx';
import { extractIngredients, inFridge, splitIngredients } from '../lib/matching.js';

/** Recipe details sub-route (/matches/:mealId) shown as a modal over the matches list. */
export default function RecipeModal({ mealId, onHide }) {
  const { fridge, logCooked } = useFridge();
  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    if (!mealId) return;
    let cancelled = false;
    setLoading(true);
    setMeal(null);
    lookupMeal(mealId).then((m) => {
      if (cancelled) return;
      setMeal(m);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [mealId]);

  // Fridge items this recipe uses (default-ticked for "I cooked this")
  const usableItems = useMemo(() => {
    if (!meal) return [];
    const ings = extractIngredients(meal);
    return fridge.filter((item) => ings.some((ing) => inFridge(ing.name, [item])));
  }, [meal, fridge]);

  useEffect(() => {
    setSelected(new Set(usableItems.map((i) => i.id)));
    // Only reset ticks when the recipe changes, not after each fridge edit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meal]);

  const { used, missing } = meal ? splitIngredients(meal, fridge) : { used: [], missing: [] };

  function toggle(id) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleCooked() {
    const items = usableItems.filter((i) => selected.has(i.id));
    logCooked(meal, items);
    toast.success(
      (t) => (
        <span>
          Logged! {items.length} item{items.length === 1 ? '' : 's'} saved from waste.{' '}
          <Link to="/saved" onClick={() => toast.dismiss(t.id)}>
            View
          </Link>
        </span>
      ),
      { duration: 5000 },
    );
    onHide();
  }

  return (
    <Modal show={Boolean(mealId)} onHide={onHide} size="lg" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>{meal?.strMeal || 'Recipe'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading && (
          <div className="text-center py-4">
            <Spinner animation="border" variant="success" />
          </div>
        )}
        {!loading && mealId && !meal && <p>Sorry, we couldn't load this recipe.</p>}
        {meal && (
          <>
            <Row className="g-3 mb-3">
              {meal.strMealThumb && (
                <Col md={5}>
                  <img src={meal.strMealThumb} alt={meal.strMeal} className="img-fluid rounded" />
                </Col>
              )}
              <Col>
                <div className="mb-2">
                  {meal.strCategory && <Badge bg="secondary" className="me-1">{meal.strCategory}</Badge>}
                  {meal.strArea && <Badge bg="info">{meal.strArea}</Badge>}
                </div>
                <h3 className="h6 text-success">✅ You have ({used.length})</h3>
                <ul className="small">
                  {used.map((i) => (
                    <li key={i.name}>
                      {i.measure} {i.name}
                    </li>
                  ))}
                </ul>
                <h3 className="h6 text-danger">🛒 Missing ({missing.length})</h3>
                <ul className="small">
                  {missing.map((i) => (
                    <li key={i.name}>
                      {i.measure} {i.name}
                    </li>
                  ))}
                </ul>
              </Col>
            </Row>
            <h3 className="h6">Instructions</h3>
            <p className="small" style={{ whiteSpace: 'pre-line' }}>
              {meal.strInstructions}
            </p>
            {meal.strYoutube && (
              <a href={meal.strYoutube} target="_blank" rel="noreferrer" className="small">
                Watch on YouTube ↗
              </a>
            )}
          </>
        )}
      </Modal.Body>
      {meal && (
        <Modal.Footer className="flex-column align-items-stretch">
          <div className="small fw-semibold">I cooked this — which fridge items did I use up?</div>
          {usableItems.length === 0 ? (
            <div className="small text-muted">None of your fridge items appear in this recipe.</div>
          ) : (
            <div className="d-flex flex-wrap gap-3">
              {usableItems.map((i) => (
                <Form.Check
                  key={i.id}
                  id={`use-${i.id}`}
                  label={i.name}
                  checked={selected.has(i.id)}
                  onChange={() => toggle(i.id)}
                />
              ))}
            </div>
          )}
          <div className="d-flex justify-content-end gap-2">
            <Button variant="outline-secondary" onClick={onHide}>
              Close
            </Button>
            <Button variant="success" onClick={handleCooked} disabled={selected.size === 0}>
              I cooked this
            </Button>
          </div>
        </Modal.Footer>
      )}
    </Modal>
  );
}
