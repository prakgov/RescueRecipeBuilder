import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Form, Button, ListGroup, Badge, Alert, ButtonGroup } from 'react-bootstrap';
import { addDays, format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { useFridge } from '../context/FridgeContext.jsx';
import { listIngredients } from '../api/mealdb.js';
import { daysLeft, expiryStatus, STATUS_LABEL, STATUS_VARIANT } from '../lib/expiry.js';
import { normalise } from '../lib/matching.js';

const iso = (d) => format(d, 'yyyy-MM-dd');

function daysText(d) {
  if (d === null) return 'no date';
  if (d < 0) return `expired ${-d}d ago`;
  if (d === 0) return 'expires today';
  if (d === 1) return 'expires tomorrow';
  return `${d} days left`;
}

export default function FridgePage() {
  const { fridge, addItem, removeItem } = useFridge();
  const [ingredients, setIngredients] = useState([]);
  const [name, setName] = useState('');
  const [expiry, setExpiry] = useState(iso(addDays(new Date(), 3)));

  useEffect(() => {
    listIngredients().then(setIngredients);
  }, []);

  // Soonest-expiring first; undated items last
  const sorted = useMemo(
    () =>
      [...fridge].sort((a, b) => {
        const da = daysLeft(a.expiry) ?? Infinity;
        const db = daysLeft(b.expiry) ?? Infinity;
        return da - db;
      }),
    [fridge],
  );
  const expiringCount = fridge.filter((i) => ['urgent', 'expired'].includes(expiryStatus(i.expiry))).length;

  const known = name && ingredients.some((i) => normalise(i) === normalise(name));

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (fridge.some((i) => normalise(i.name) === normalise(trimmed))) {
      toast.error(`${trimmed} is already in your fridge`);
      return;
    }
    // Use TheMealDB's canonical spelling when we recognise the item
    const canonical = ingredients.find((i) => normalise(i) === normalise(trimmed)) || trimmed;
    addItem(canonical, expiry);
    toast.success(`Added ${canonical}`);
    setName('');
  }

  return (
    <Row className="g-4">
      <Col lg={5}>
        <Card>
          <Card.Body>
            <Card.Title>Add an ingredient</Card.Title>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="ing-name">
                <Form.Label>Ingredient</Form.Label>
                <Form.Control
                  list="ingredient-options"
                  placeholder="e.g. Chicken, Spinach, Rice"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                />
                <datalist id="ingredient-options">
                  {ingredients.map((i) => (
                    <option key={i} value={i} />
                  ))}
                </datalist>
                {name && !known && ingredients.length > 0 && (
                  <Form.Text className="text-warning">
                    Not in TheMealDB's ingredient list — it may not match any recipes.
                  </Form.Text>
                )}
              </Form.Group>
              <Form.Group className="mb-3" controlId="ing-expiry">
                <Form.Label>Use by</Form.Label>
                <Form.Control type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
                <ButtonGroup size="sm" className="mt-2">
                  {[1, 3, 7, 14].map((d) => (
                    <Button key={d} variant="outline-secondary" onClick={() => setExpiry(iso(addDays(new Date(), d)))}>
                      +{d}d
                    </Button>
                  ))}
                  <Button variant="outline-secondary" onClick={() => setExpiry('')}>
                    No date
                  </Button>
                </ButtonGroup>
              </Form.Group>
              <Button type="submit" variant="success" disabled={!name.trim()}>
                Add to fridge
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Col>

      <Col lg={7}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h2 className="h4 mb-0">My Fridge</h2>
          {fridge.length > 0 && (
            <Button as={Link} to="/matches" variant="success" size="sm">
              Find recipes →
            </Button>
          )}
        </div>

        {expiringCount > 0 && (
          <Alert variant="danger" className="py-2">
            ⏰ {expiringCount} {expiringCount > 1 ? 'items need' : 'item needs'} using in the next 2 days. Recipes using them rank
            higher.
          </Alert>
        )}

        {fridge.length === 0 ? (
          <Card body className="text-center text-muted">
            Your fridge is empty. Add a few ingredients to get recipe ideas.
          </Card>
        ) : (
          <ListGroup>
            {sorted.map((item) => {
              const status = expiryStatus(item.expiry);
              return (
                <ListGroup.Item key={item.id} className="d-flex align-items-center gap-2">
                  <div className="flex-grow-1">
                    <div className="fw-semibold">{item.name}</div>
                    <small className="text-muted">
                      {item.expiry ? format(parseISO(item.expiry), 'd MMM') + ' · ' : ''}
                      {daysText(daysLeft(item.expiry))}
                    </small>
                  </div>
                  <Badge bg={STATUS_VARIANT[status]} text={status === 'soon' ? 'dark' : undefined}>
                    {STATUS_LABEL[status]}
                  </Badge>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => {
                      removeItem(item.id);
                      toast(`Removed ${item.name}`);
                    }}
                  >
                    ✕
                  </Button>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        )}
      </Col>
    </Row>
  );
}
