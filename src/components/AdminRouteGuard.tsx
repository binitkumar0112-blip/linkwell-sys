// @ts-nocheck
import { Navigate } from 'react-router-dom';
import { useAuth } from '../services/useAuth';
import { Loader2 } from 'lucide-react';

export default function AdminRouteGuard({ children }: { children: JSX.Element }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user || role !== 'superadmin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
