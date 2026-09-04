import { useEffect, useState } from 'react';
import { apiClient, authHeaders, errorMessage } from '../api/client';

const TOKEN_KEY = 'superAdminToken';

function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('sunil@verticalinfinity.in');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.post('/auth/super-admin/login', { email, secret });
      localStorage.setItem(TOKEN_KEY, data.token);
      onLogin(data.token);
    } catch (err) {
      setError(errorMessage(err, 'Invalid credentials'));
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-purple-50 p-6">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm flex flex-col gap-3">
        <h1 className="text-xl font-bold text-gray-800 text-center">🙏 Super Admin</h1>
        <input className="border rounded px-3 py-2 text-sm" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="border rounded px-3 py-2 text-sm" placeholder="Secret key" type="password" value={secret} onChange={(e) => setSecret(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="bg-orange-600 text-white rounded-lg py-2 font-semibold disabled:opacity-50">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

function CreateTenantForm({ token, onCreated }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await apiClient.post('/super-admin/tenants', { name, slug, adminEmail }, { headers: authHeaders(token) });
      onCreated(data);
      setName(''); setSlug(''); setAdminEmail('');
    } catch (err) {
      setError(errorMessage(err));
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 flex flex-col gap-2">
      <h2 className="font-bold text-gray-800">Create a new portal</h2>
      <div className="grid sm:grid-cols-3 gap-2">
        <div>
          <input className="border rounded px-3 py-2 text-sm w-full" placeholder="Portal name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
          <p className="text-xs text-gray-400 mt-1">Max 60 characters</p>
        </div>
        <div>
          <input className="border rounded px-3 py-2 text-sm w-full" placeholder="url-slug" maxLength={40} value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} />
          <p className="text-xs text-gray-400 mt-1">Lowercase, hyphens only, max 40 chars</p>
        </div>
        <div>
          <input className="border rounded px-3 py-2 text-sm w-full" placeholder="Portal admin email" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
          <p className="text-xs text-gray-400 mt-1">Used for the admin's login</p>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={saving} className="self-start bg-purple-600 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50">
        {saving ? 'Creating…' : 'Create portal'}
      </button>
    </form>
  );
}

function TenantRow({ tenant, token, onChange }) {
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggleActive() {
    setBusy(true);
    const { data } = await apiClient.patch(`/super-admin/tenants/${tenant._id}`, { isActive: !tenant.isActive }, { headers: authHeaders(token) });
    onChange(data);
    setBusy(false);
  }

  async function resetToken() {
    setBusy(true);
    const { data } = await apiClient.post(`/super-admin/tenants/${tenant._id}/reset-token`, {}, { headers: authHeaders(token) });
    onChange(data);
    setBusy(false);
  }

  return (
    <tr className="border-b last:border-0">
      <td className="py-2 pr-3">
        <p className="font-semibold text-gray-800">{tenant.name}</p>
        <a href={`/portal/${tenant.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-600 underline">/portal/{tenant.slug}</a>
      </td>
      <td className="py-2 pr-3 text-sm text-gray-600">{tenant.adminEmail}</td>
      <td className="py-2 pr-3 text-sm font-mono">
        {revealed ? tenant.adminToken : '••••••••'}
        <button onClick={() => setRevealed((r) => !r)} className="ml-2 text-xs text-orange-600 underline">
          {revealed ? 'hide' : 'show'}
        </button>
      </td>
      <td className="py-2 pr-3">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${tenant.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
          {tenant.isActive ? 'Active' : 'Deactivated'}
        </span>
      </td>
      <td className="py-2 flex gap-2 flex-wrap">
        <button disabled={busy} onClick={toggleActive} className="text-xs border rounded px-2 py-1 font-semibold text-gray-700">
          {tenant.isActive ? 'Deactivate' : 'Activate'}
        </button>
        <button disabled={busy} onClick={resetToken} className="text-xs border rounded px-2 py-1 font-semibold text-gray-700">
          Reset token
        </button>
      </td>
    </tr>
  );
}

export default function SuperAdminDashboard() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [tenants, setTenants] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    apiClient.get('/super-admin/tenants', { headers: authHeaders(token) })
      .then((res) => setTenants(res.data))
      .catch((err) => {
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        } else {
          setError(errorMessage(err));
        }
      });
  }, [token]);

  if (!token) return <LoginForm onLogin={setToken} />;

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }

  function upsertTenant(tenant) {
    setTenants((list) => {
      const exists = list.some((t) => t._id === tenant._id);
      return exists ? list.map((t) => (t._id === tenant._id ? tenant : t)) : [tenant, ...list];
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">🙏 Super Admin Dashboard</h1>
          <button onClick={handleLogout} className="text-sm text-gray-500 underline">Log out</button>
        </header>

        <CreateTenantForm token={token} onCreated={upsertTenant} />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="bg-white rounded-lg shadow-md p-4 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-xs uppercase text-gray-500">
                <th className="py-2">Portal</th>
                <th className="py-2">Admin email</th>
                <th className="py-2">Admin token</th>
                <th className="py-2">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => <TenantRow key={t._id} tenant={t} token={token} onChange={upsertTenant} />)}
              {tenants.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-gray-400">No portals yet. Create one above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
