import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center"
      style={{ minHeight: '100vh', gap: 16 }}
    >
      <h1 style={{ fontSize: '4rem', fontWeight: 700, margin: 0 }}>404</h1>
      <p className="text-muted">Page not found.</p>
      <Link to="/" className="btn btn-outline-dark">
        Back to Home
      </Link>
    </div>
  );
}
