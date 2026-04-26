import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function PublicOnlyRoute() {
  const auth = useAuth();

  if (auth.status === 'loading') {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  if (auth.status === 'authenticated') {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <Outlet />;
}
