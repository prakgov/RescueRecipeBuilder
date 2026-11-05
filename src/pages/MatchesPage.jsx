import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Row, Col, Card, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import { useFridge } from '../context/FridgeContext.jsx';
import { filterByIngredient, lookupMeal } from '../api/mealdb.js';
import { rankRecipes, splitIngredients } from '../lib/matching.js';
import { expiryStatus } from '../lib/expiry.js';
import RecipeModal from '../components/RecipeModal.jsx';

const DETAIL_COUNT = 6; // Step 4: only fetch full details for the top few recipes
const SHOW_COUNT = 12;

export default function MatchesPage() {
  const { fridge } = useFridge();
  const { mealId } = useParams();
  const navigate = useNavigate();

  const [results, setResults] = useState(null); // { [fridgeItemId]: meals[] }
  const [details, setDetails] = useState({}); // { [idMeal]: lookup.php meal }
  const [error, setError] = useState(null);
  const requested = useRef(new Set()); // ids already looked up, so a failed lookup isn't retried in a loop

  // Only re-search when the set of names changes, not on unrelated re-renders
  const fridgeKey = fridge.map((i) => i.id).join('|');

  // Step 1: one filter.php call per fridge item, in parallel
  useEffect(() => {
    let cancelled = false;
    setResults(null);
    setError(null);
    Promise.all(fridge.map((item) => filterByIngredient(item.name).then((meals) => [item.id, meals])))
      .then((pairs) => !cancelled && setResults(Object.fromEntries(pairs)))
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fridgeKey]);

  // Steps 2 + 3: merge, count and weight by expiry
  const ranked = useMemo(() => (results ? rankRecipes(fridge, results) : []), [results, fridge]);

  // Step 4: lookup.php for the top few only
  useEffect(() => {
    const top = ranked.slice(0, DETAIL_COUNT).filter((r) => !requested.current.has(r.meal.idMeal));
    if (!top.length) return;
    top.forEach((r) => requested.current.add(r.meal.idMeal));
    Promise.all(top.map((r) => lookupMeal(r.meal.idMeal))).then((meals) => {
      setDetails((d) => {
        const next = { ...d };
        meals.forEach((m) => m && (next[m.idMeal] = m));
        return next;
      });
    });
  }, [ranked]);

  if (fridge.length === 0) {
    return (
      <Card body className="text-center">
        <p className="mb-3">Add some ingredients to your fridge first, then we'll find recipes that use them.</p>
        <Button as={Link} to="/fridge" variant="success">
          Go to My Fridge
        </Button>
      </Card>
    );
  }

  const bestMatchCount = ranked[0]?.matchedItems.length ?? 0;
  const closestOnly = fridge.length > 1 && bestMatchCount === 1;

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-baseline mb-3 gap-2">
        <h2 className="h4 mb-0">Recipe Matches</h2>
        <small className="text-muted">
          Ranked by how many of your {fridge.length} items each recipe uses · items expiring soon count extra
        </small>
      </div>

      {error && <Alert variant="danger">Something went wrong: {error}</Alert>}

      {!results && !error && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="success" />
          <div className="mt-2 text-muted">Checking {fridge.length} ingredients…</div>
        </div>
      )}

      {results && ranked.length === 0 && (
        <Alert variant="info">
          🤔 No recipes found for these ingredients. TheMealDB has a small curated set, so try adding a common staple
          like <em>Chicken</em>, <em>Eggs</em>, <em>Rice</em> or <em>Onion</em>.
        </Alert>
      )}

      {closestOnly && (
        <Alert variant="secondary" className="py-2">
          No recipe uses more than one of your items, so here are the <strong>closest matches</strong>.
        </Alert>
      )}

      <Row xs={1} sm={2} lg={3} className="g-3">
        {ranked.slice(0, SHOW_COUNT).map((r) => {
          const detail = details[r.meal.idMeal];
          const missing = detail ? splitIngredients(detail, fridge).missing.length : null;
          return (
            <Col key={r.meal.idMeal}>
              <Card
                className="h-100 recipe-card shadow-sm"
                role="button"
                onClick={() => navigate(`/matches/${r.meal.idMeal}`)}
              >
                {r.meal.strMealThumb ? (
                  <Card.Img variant="top" src={`${r.meal.strMealThumb}/medium`} alt="" loading="lazy" />
                ) : (
                  <div className="recipe-thumb-placeholder card-img-top">🍲</div>
                )}
                <Card.Body>
                  <Card.Title className="h6">{r.meal.strMeal}</Card.Title>
                  <div className="small mb-2">
                    Uses <strong>{r.matchedItems.length}</strong> of your items
                    {missing !== null && (
                      <>
                        {' · '}
                        <span className={missing <= 3 ? 'text-success' : 'text-muted'}>{missing} missing</span>
                      </>
                    )}
                  </div>
                  <div className="d-flex flex-wrap gap-1">
                    {r.matchedItems.map((i) => {
                      const s = expiryStatus(i.expiry);
                      const hot = s === 'urgent' || s === 'expired';
                      return (
                        <Badge key={i.id} bg={hot ? 'danger' : 'light'} text={hot ? undefined : 'dark'} className="border">
                          {hot && '⏰ '}
                          {i.name}
                        </Badge>
                      );
                    })}
                  </div>
                </Card.Body>
                <Card.Footer className="small text-muted d-flex justify-content-between">
                  <span>Score {r.score}</span>
                  {r.urgentCount > 0 && <span className="text-danger">Rescues {r.urgentCount} urgent</span>}
                </Card.Footer>
              </Card>
            </Col>
          );
        })}
      </Row>

      {ranked.length > SHOW_COUNT && (
        <p className="text-muted small mt-3">Showing top {SHOW_COUNT} of {ranked.length} recipes.</p>
      )}

      <RecipeModal mealId={mealId} onHide={() => navigate('/matches')} />
    </>
  );
}
