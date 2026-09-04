import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import TenantAdminDashboard from './pages/TenantAdminDashboard';
import PortalHome from './pages/PortalHome';

// Set only for a per-Mandal Capacitor build — locks the whole app to that
// Mandal's portal instead of showing the multi-tenant landing page. Unset
// (the normal web build) behaves exactly as before.
const LOCKED_TENANT_SLUG = import.meta.env.VITE_LOCKED_TENANT_SLUG;

export default function App() {
  const home = LOCKED_TENANT_SLUG ? <Navigate to={`/portal/${LOCKED_TENANT_SLUG}`} replace /> : <Landing />;
  return (
    <Routes>
      <Route path="/" element={home} />
      <Route path="/super-admin" element={<SuperAdminDashboard />} />
      <Route path="/portal/:tenantSlug/admin" element={<TenantAdminDashboard />} />
      <Route path="/portal/:tenantSlug" element={<PortalHome />} />
      <Route path="*" element={home} />
    </Routes>
  );
}
