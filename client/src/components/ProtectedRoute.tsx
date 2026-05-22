import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute() {
  const { authState } = useAuth();

  if (authState === 'authenticated') {
    return <Outlet />;
  }

  return <Navigate to="/" replace />;
}

export default ProtectedRoute;
