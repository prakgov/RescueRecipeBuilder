import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Navbar, Nav, Container, Alert, Badge } from 'react-bootstrap';
import { Toaster } from 'react-hot-toast';
import FridgePage from './pages/FridgePage.jsx';
import MatchesPage from './pages/MatchesPage.jsx';
import SavedPage from './pages/SavedPage.jsx';
import { apiState } from './api/mealdb.js';
import { useFridge } from './context/FridgeContext.jsx';

export default function App() {
  const [offline, setOffline] = useState(apiState.offline);
  const { fridge } = useFridge();

  useEffect(() => {
    apiState.listeners.add(setOffline);
    return () => apiState.listeners.delete(setOffline);
  }, []);

  return (
    // Full-height flex column so the footer sits at the bottom even on short pages.
    <div className="d-flex flex-column min-vh-100">
      <Navbar bg="success" variant="dark" expand="sm" collapseOnSelect className="mb-4">
        <Container>
          <Navbar.Brand as={NavLink} to="/">
            🥕 FridgeSaver
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-nav" />
          <Navbar.Collapse id="main-nav">
            <Nav className="ms-auto">
              <Nav.Link as={NavLink} to="/fridge" eventKey="fridge">
                My Fridge <Badge bg="light" text="dark">{fridge.length}</Badge>
              </Nav.Link>
              <Nav.Link as={NavLink} to="/matches" eventKey="matches">
                Recipe Matches
              </Nav.Link>
              <Nav.Link as={NavLink} to="/saved" eventKey="saved">
                Saved from Waste
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="pb-5 flex-grow-1">
        {offline && (
          <Alert variant="warning" className="small">
            Couldn't reach TheMealDB, so you're seeing a small <strong>offline sample</strong> of recipes.
            Live results will return when the connection does.
          </Alert>
        )}
        <Routes>
          <Route path="/" element={<Navigate to="/fridge" replace />} />
          <Route path="/fridge" element={<FridgePage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/matches/:mealId" element={<MatchesPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="*" element={<Navigate to="/fridge" replace />} />
        </Routes>
      </Container>
      {/* AGPL-3.0 §13: users of a network-served app must be offered the source, hence the link. */}
      <footer className="border-top py-3 text-center text-muted small">
        <Container>
          © 2026 Prakirth Govardhanam ·{' '}
          Licensed under{' '}
          <a
            href="https://github.com/prakgov/RescueRecipeBuilder/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
          >
            AGPL-3.0-or-later
          </a>{' '}
          ·{' '}
          <a
            href="https://github.com/prakgov/RescueRecipeBuilder"
            target="_blank"
            rel="noopener noreferrer"
          >
            Source code
          </a>
        </Container>
      </footer>
      <Toaster position="bottom-center" />
    </div>
  );
}
