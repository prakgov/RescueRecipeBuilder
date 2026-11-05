/* eslint-disable react-refresh/only-export-components */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Table, Button, ButtonGroup } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { startOfWeek, startOfDay, subWeeks, subDays, format, parseISO, isBefore } from 'date-fns';
import { useFridge } from '../context/FridgeContext.jsx';

const BAR_COLOR = '#008300'; // single series → one hue; the title names it, no legend needed

/** Bucket the cooked log into the last N days or weeks (empty buckets included). */
export function bucketLog(log, mode, now = new Date()) {
  const n = mode === 'week' ? 8 : 14;
  const start = mode === 'week' ? (d) => startOfWeek(d, { weekStartsOn: 1 }) : startOfDay;
  const step = mode === 'week' ? subWeeks : subDays;
  const buckets = [];
  for (let i = n - 1; i >= 0; i--) {
    const s = start(step(now, i));
    buckets.push({ key: s.getTime(), label: format(s, 'd MMM'), items: 0, meals: 0 });
  }
  for (const entry of log) {
    const k = start(parseISO(entry.date)).getTime();
    const b = buckets.find((x) => x.key === k);
    if (b) {
      b.items += entry.items.length;
      b.meals += 1;
    }
  }
  return buckets;
}

function ChartTooltip({ active, payload, mode }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="fw-semibold">{mode === 'week' ? `Week of ${d.label}` : d.label}</div>
      <div>
        {d.items} item{d.items === 1 ? '' : 's'} rescued · {d.meals} meal{d.meals === 1 ? '' : 's'}
      </div>
    </div>
  );
}

function StatTile({ label, value, hint }) {
  return (
    <Card className="stat-tile h-100">
      <Card.Body>
        <div className="text-muted small">{label}</div>
        <div className="value">{value}</div>
        {hint && <div className="small text-muted">{hint}</div>}
      </Card.Body>
    </Card>
  );
}

export default function SavedPage() {
  const { log, removeLogEntry } = useFridge();
  const [mode, setMode] = useState('week');

  const data = useMemo(() => bucketLog(log, mode), [log, mode]);
  const totalItems = log.reduce((n, e) => n + e.items.length, 0);
  const urgentItems = log.reduce(
    (n, e) => n + e.items.filter((i) => i.status === 'urgent' || i.status === 'expired').length,
    0,
  );
  const last30 = log.filter((e) => !isBefore(parseISO(e.date), subDays(new Date(), 30))).length;

  const topItems = useMemo(() => {
    const counts = {};
    log.forEach((e) => e.items.forEach((i) => (counts[i.name] = (counts[i.name] || 0) + 1)));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [log]);

  if (log.length === 0) {
    return (
      <Card body className="text-center">
        <h2 className="h4">Saved from Waste</h2>
        <p className="text-muted">
          Nothing logged yet. Open a recipe from <Link to="/matches">Recipe Matches</Link> and press{' '}
          <strong>I cooked this</strong> to start tracking what you've rescued.
        </p>
      </Card>
    );
  }

  return (
    <>
      <h2 className="h4 mb-3">Saved from Waste</h2>
      <Row xs={1} sm={3} className="g-3 mb-4">
        <Col>
          <StatTile label="Items rescued" value={totalItems} hint={`across ${log.length} meal${log.length === 1 ? "" : "s"}`} />
        </Col>
        <Col>
          <StatTile label="Rescued near expiry" value={urgentItems} hint="used within 2 days of the date, or after" />
        </Col>
        <Col>
          <StatTile label="Meals in last 30 days" value={last30} />
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <Card.Title className="h6 mb-0">Items rescued per {mode}</Card.Title>
            <ButtonGroup size="sm">
              <Button variant={mode === 'day' ? 'success' : 'outline-success'} onClick={() => setMode('day')}>
                Last 14 days
              </Button>
              <Button variant={mode === 'week' ? 'success' : 'outline-success'} onClick={() => setMode('week')}>
                Last 8 weeks
              </Button>
            </ButtonGroup>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#e9ecef" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6c757d' }} tickLine={false} axisLine={{ stroke: '#ced4da' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6c757d' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip mode={mode} />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Bar dataKey="items" name="Items rescued" fill={BAR_COLOR} radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card.Body>
      </Card>

      <Row className="g-4">
        <Col md={4}>
          <Card>
            <Card.Body>
              <Card.Title className="h6">Most rescued</Card.Title>
              <Table size="sm" borderless className="mb-0">
                <tbody>
                  {topItems.map(([name, count]) => (
                    <tr key={name}>
                      <td>{name}</td>
                      <td className="text-end">{count}×</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        <Col md={8}>
          <Card>
            <Card.Body>
              <Card.Title className="h6">Cooking log</Card.Title>
              <Table size="sm" hover responsive className="mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Meal</th>
                    <th>Items used</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {log.map((e) => (
                    <tr key={e.id}>
                      <td className="text-nowrap">{format(parseISO(e.date), 'd MMM')}</td>
                      <td>{e.mealName}</td>
                      <td className="small">{e.items.map((i) => i.name).join(', ')}</td>
                      <td className="text-end">
                        <Button size="sm" variant="link" className="text-danger p-0" onClick={() => removeLogEntry(e.id)}>
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <p className="small text-muted mt-3">
        FridgeSaver counts ingredients you used up. It doesn't estimate CO₂ or money saved, since we don't have reliable
        data for that.
      </p>
    </>
  );
}
