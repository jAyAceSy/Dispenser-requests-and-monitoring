import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { AppShell } from './components/AppShell';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NewRequest } from './pages/NewRequest';
import { MyRequests } from './pages/MyRequests';
import { IncomingRequests } from './pages/IncomingRequests';
import { AllRequests } from './pages/AllRequests';
import { Approvals } from './pages/Approvals';
import { PendingApproval } from './pages/PendingApproval';
import { RequestDetail } from './pages/RequestDetail';
import { PrintRequest } from './pages/PrintRequest';
import { Monitoring } from './pages/Monitoring';
import { Reports } from './pages/Reports';
import { Stores } from './pages/master/Stores';
import { Items } from './pages/master/Items';
import { Warehouses } from './pages/master/Warehouses';
import { Users } from './pages/master/Users';
import { hasAnyRole, type UserRole } from './lib/types';

function Protected({ children, roles }: { children: React.ReactNode; roles?: UserRole[] }) {
  const { session, profile, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-[var(--ink-soft)]">Loading…</div>;
  if (!session) return <Navigate to="/login" replace />;
  if (!profile) return <div className="min-h-screen flex items-center justify-center text-sm text-[var(--ink-soft)]">Setting up your account…</div>;
  if (!profile.active) return <PendingApproval />;
  if (roles && !hasAnyRole(profile, roles)) return <Navigate to="/dashboard" replace />;
  return <AppShell>{children}</AppShell>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/new-request" element={<Protected roles={['insti_team', 'admin']}><NewRequest /></Protected>} />
      <Route path="/my-requests" element={<Protected roles={['insti_team', 'admin']}><MyRequests /></Protected>} />
      <Route path="/approvals" element={<Protected roles={['approving_officer']}><Approvals /></Protected>} />
      <Route path="/incoming" element={<Protected roles={['warehouse_officer']}><IncomingRequests /></Protected>} />
      <Route path="/all-requests" element={<Protected roles={['admin']}><AllRequests /></Protected>} />
      <Route path="/request/:id" element={<Protected><RequestDetail /></Protected>} />
      <Route path="/print/:id" element={<Protected><PrintRequest /></Protected>} />
      <Route path="/monitoring" element={<Protected><Monitoring /></Protected>} />
      <Route path="/reports" element={<Protected roles={['admin']}><Reports /></Protected>} />
      <Route path="/master/stores" element={<Protected roles={['admin']}><Stores /></Protected>} />
      <Route path="/master/items" element={<Protected roles={['admin']}><Items /></Protected>} />
      <Route path="/master/warehouses" element={<Protected roles={['admin']}><Warehouses /></Protected>} />
      <Route path="/master/users" element={<Protected roles={['admin']}><Users /></Protected>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
