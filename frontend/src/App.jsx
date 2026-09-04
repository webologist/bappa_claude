import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import TenantAdminDashboard from './pages/TenantAdminDashboard';
import PortalHome from './pages/PortalHome';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/super-admin" element={<SuperAdminDashboard />} />
      <Route path="/portal/:tenantSlug/admin" element={<TenantAdminDashboard />} />
      <Route path="/portal/:tenantSlug" element={<PortalHome />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
