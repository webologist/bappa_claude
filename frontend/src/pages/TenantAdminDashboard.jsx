import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient, authHeaders, errorMessage } from '../api/client';
import { useSocket } from '../hooks/useSocket';
import { THEMES, DEFAULT_THEME } from '../themes';

function useObjectUrlPreview(file, fallbackUrl) {
  const [preview, setPreview] = useState(fallbackUrl || '');
  useEffect(() => {
    if (!file) { setPreview(fallbackUrl || ''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, fallbackUrl]);
  return preview;
}

const FILE_HINT = 'JPG/PNG/WebP, up to 10MB';

function tokenKey(slug) { return `portalAdminToken_${slug}`; }

function LoginForm({ tenantSlug, onLogin }) {
  const [email, setEmail] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.post('/auth/portal-admin/login', { tenantSlug, email, token: adminToken });
      localStorage.setItem(tokenKey(tenantSlug), data.token);
      onLogin(data.token);
    } catch (err) {
      setError(errorMessage(err, 'Invalid credentials'));
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-purple-50 p-6">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm flex flex-col gap-3">
        <h1 className="text-xl font-bold text-gray-800 text-center">Portal Admin · {tenantSlug}</h1>
        <input className="border rounded px-3 py-2 text-sm" placeholder="Admin email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="border rounded px-3 py-2 text-sm" placeholder="Admin token" type="password" value={adminToken} onChange={(e) => setAdminToken(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="bg-orange-600 text-white rounded-lg py-2 font-semibold disabled:opacity-50">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

function BrandingTab({ tenantSlug, token }) {
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [status, setStatus] = useState('');
  const [loaded, setLoaded] = useState(false);
  const logoPreview = useObjectUrlPreview(logoFile, logoUrl);

  useEffect(() => {
    apiClient.get(`/portal/${tenantSlug}/admin/branding`, { headers: authHeaders(token) }).then((res) => {
      setName(res.data.name || '');
      setLogoUrl(res.data.logoUrl || '');
      setTheme(res.data.theme || DEFAULT_THEME);
      setLoaded(true);
    });
  }, [tenantSlug, token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('Saving…');
    try {
      let finalLogoUrl = logoUrl;
      if (logoFile) {
        const form = new FormData();
        form.append('file', logoFile);
        // Don't set Content-Type manually for FormData — axios needs to add its own
        // multipart boundary, otherwise the server can't parse the uploaded file.
        const { data } = await apiClient.post(`/portal/${tenantSlug}/admin/upload`, form, {
          headers: authHeaders(token)
        });
        finalLogoUrl = data.url;
        setLogoUrl(finalLogoUrl);
        setLogoFile(null);
      }
      await apiClient.patch(`/portal/${tenantSlug}/admin/branding`, { name, logoUrl: finalLogoUrl, theme }, { headers: authHeaders(token) });
      setStatus('Saved');
    } catch (err) {
      setStatus(errorMessage(err));
    }
  }

  if (!loaded) return <p className="text-sm text-gray-400">Loading…</p>;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 flex flex-col gap-4 max-w-md">
      <h2 className="font-bold text-gray-800">Branding</h2>

      <div>
        <input
          className="border rounded px-3 py-2 text-sm w-full"
          placeholder="Portal display name"
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <p className="text-xs text-gray-400 mt-1">{name.length}/60 characters</p>
      </div>

      <div className="flex items-center gap-3">
        {logoPreview ? (
          <img src={logoPreview} alt="Logo preview" className="w-14 h-14 rounded-full object-cover border shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-2xl shrink-0">🙏</div>
        )}
        <div className="flex-1">
          <input type="file" accept="image/*" className="text-sm" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
          <p className="text-xs text-gray-400 mt-1">Logo — square image recommended, {FILE_HINT}</p>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-1.5">Theme color</p>
        <div className="flex gap-2">
          {Object.entries(THEMES).map(([key, t]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTheme(key)}
              className={`w-9 h-9 rounded-full transition ${theme === key ? 'ring-2 ring-offset-2 ring-gray-800' : ''}`}
              style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})` }}
              title={t.label}
              aria-label={t.label}
            />
          ))}
        </div>
      </div>

      <button className="self-start bg-purple-600 text-white rounded-lg px-4 py-2 text-sm font-semibold">Save branding</button>
      {status && <p className="text-sm text-gray-600">{status}</p>}
    </form>
  );
}

function AudioTab({ tenantSlug, token }) {
  const [tracks, setTracks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [marathi, setMarathi] = useState('');
  const [gujarati, setGujarati] = useState('');
  const [english, setEnglish] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const thumbPreview = useObjectUrlPreview(thumbnailFile, thumbnailUrl);

  function refresh() {
    apiClient.get(`/portal/${tenantSlug}/admin/audio`, { headers: authHeaders(token) }).then((res) => setTracks(res.data));
  }
  useEffect(refresh, [tenantSlug, token]);

  function resetForm() {
    setEditingId(null);
    setTitle(''); setMarathi(''); setGujarati(''); setEnglish('');
    setThumbnailFile(null); setThumbnailUrl('');
    setError('');
  }

  function startEdit(track) {
    setEditingId(track._id);
    setTitle(track.title);
    setMarathi(track.lyrics?.marathi || '');
    setGujarati(track.lyrics?.gujarati || '');
    setEnglish(track.lyrics?.english || '');
    setThumbnailUrl(track.thumbnailUrl || '');
    setThumbnailFile(null);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title) return setError('A title is required.');
    setSaving(true);
    setError('');
    try {
      let finalThumbnail = thumbnailUrl;
      if (thumbnailFile) {
        const form = new FormData();
        form.append('file', thumbnailFile);
        // Don't set Content-Type manually for FormData — axios needs to add its own
        // multipart boundary, otherwise the server can't parse the uploaded file.
        const { data: uploaded } = await apiClient.post(`/portal/${tenantSlug}/admin/upload`, form, {
          headers: authHeaders(token)
        });
        finalThumbnail = uploaded.url;
      }
      const payload = { title, thumbnailUrl: finalThumbnail, lyrics: { marathi, gujarati, english } };
      if (editingId) {
        await apiClient.patch(`/portal/${tenantSlug}/admin/audio/${editingId}`, payload, { headers: authHeaders(token) });
      } else {
        await apiClient.post(`/portal/${tenantSlug}/admin/audio`, payload, { headers: authHeaders(token) });
      }
      resetForm();
      refresh();
    } catch (err) {
      setError(errorMessage(err));
    }
    setSaving(false);
  }

  async function handleDelete(id) {
    await apiClient.delete(`/portal/${tenantSlug}/admin/audio/${id}`, { headers: authHeaders(token) });
    if (editingId === id) resetForm();
    refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 flex flex-col gap-3 max-w-lg">
        <h2 className="font-bold text-gray-800">{editingId ? 'Edit Aarti' : 'Add Aarti'}</h2>

        <div>
          <input
            className="border rounded px-3 py-2 text-sm w-full"
            placeholder="Title"
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">{title.length}/100 characters</p>
        </div>

        <div className="flex items-center gap-3">
          {thumbPreview ? (
            <img src={thumbPreview} alt="Thumbnail preview" className="w-14 h-14 rounded-lg object-cover border shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-xl shrink-0">🙏</div>
          )}
          <div className="flex-1">
            <input type="file" accept="image/*" className="text-sm" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} />
            <p className="text-xs text-gray-400 mt-1">Thumbnail (optional) — square image, {FILE_HINT}</p>
          </div>
        </div>

        <div>
          <textarea
            className="border rounded px-3 py-2 text-sm w-full"
            placeholder="Lyrics (Marathi)"
            rows={3}
            maxLength={5000}
            value={marathi}
            onChange={(e) => setMarathi(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">{marathi.length}/5000 characters</p>
        </div>
        <div>
          <textarea
            className="border rounded px-3 py-2 text-sm w-full"
            placeholder="Lyrics (Gujarati)"
            rows={3}
            maxLength={5000}
            value={gujarati}
            onChange={(e) => setGujarati(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">{gujarati.length}/5000 characters</p>
        </div>
        <div>
          <textarea
            className="border rounded px-3 py-2 text-sm w-full"
            placeholder="Lyrics (English)"
            rows={3}
            maxLength={5000}
            value={english}
            onChange={(e) => setEnglish(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">{english.length}/5000 characters</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button disabled={saving} className="self-start bg-purple-600 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50">
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add track'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="self-start border rounded-lg px-4 py-2 text-sm font-semibold text-gray-600">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="font-bold text-gray-800 mb-2">Tracks ({tracks.length})</h2>
        <ul className="flex flex-col divide-y">
          {tracks.map((t) => (
            <li key={t._id} className="py-2 flex justify-between items-center gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {t.thumbnailUrl ? (
                  <img src={t.thumbnailUrl} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-sm shrink-0">🙏</div>
                )}
                <span className="text-sm text-gray-700 truncate">{t.title}</span>
              </div>
              <div className="flex gap-3 shrink-0">
                <button onClick={() => startEdit(t)} className="text-xs text-purple-600 underline">Edit</button>
                <button onClick={() => handleDelete(t._id)} className="text-xs text-red-600 underline">Delete</button>
              </div>
            </li>
          ))}
          {tracks.length === 0 && <p className="text-sm text-gray-400 py-2">No tracks yet.</p>}
        </ul>
      </div>
    </div>
  );
}

function toLocalDateTimeInput(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EventsTab({ tenantSlug, token }) {
  const [events, setEvents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');

  function refresh() {
    apiClient.get(`/portal/${tenantSlug}/admin/events`, { headers: authHeaders(token) }).then((res) => setEvents(res.data));
  }
  useEffect(refresh, [tenantSlug, token]);

  function resetForm() {
    setEditingId(null);
    setTitle(''); setDescription(''); setStartTime(''); setEndTime(''); setError('');
  }

  function startEdit(ev) {
    setEditingId(ev._id);
    setTitle(ev.title);
    setDescription(ev.description || '');
    setStartTime(toLocalDateTimeInput(ev.startTime));
    setEndTime(toLocalDateTimeInput(ev.endTime));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title || !startTime || !endTime) return setError('Title, start and end time are required.');
    try {
      const payload = { title, description, startTime, endTime };
      if (editingId) {
        await apiClient.patch(`/portal/${tenantSlug}/admin/events/${editingId}`, payload, { headers: authHeaders(token) });
      } else {
        await apiClient.post(`/portal/${tenantSlug}/admin/events`, payload, { headers: authHeaders(token) });
      }
      resetForm();
      refresh();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleDelete(id) {
    await apiClient.delete(`/portal/${tenantSlug}/admin/events/${id}`, { headers: authHeaders(token) });
    if (editingId === id) resetForm();
    refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 flex flex-col gap-2 max-w-lg">
        <h2 className="font-bold text-gray-800">{editingId ? 'Edit program event' : 'Add program event'}</h2>
        <div>
          <input
            className="border rounded px-3 py-2 text-sm w-full"
            placeholder="Title"
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">{title.length}/100 characters</p>
        </div>
        <div>
          <textarea
            className="border rounded px-3 py-2 text-sm w-full"
            placeholder="Description"
            rows={2}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">{description.length}/500 characters</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input type="datetime-local" className="border rounded px-3 py-2 text-sm" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <input type="datetime-local" className="border rounded px-3 py-2 text-sm" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button className="self-start bg-purple-600 text-white rounded-lg px-4 py-2 text-sm font-semibold">
            {editingId ? 'Save changes' : 'Add event'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="self-start border rounded-lg px-4 py-2 text-sm font-semibold text-gray-600">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="font-bold text-gray-800 mb-2">Schedule ({events.length})</h2>
        <ul className="flex flex-col divide-y">
          {events.map((ev) => (
            <li key={ev._id} className="py-2 flex justify-between items-center gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{ev.title}</p>
                <p className="text-xs text-gray-500">{new Date(ev.startTime).toLocaleString()} – {new Date(ev.endTime).toLocaleString()}</p>
              </div>
              <div className="flex gap-3 shrink-0">
                <button onClick={() => startEdit(ev)} className="text-xs text-purple-600 underline">Edit</button>
                <button onClick={() => handleDelete(ev._id)} className="text-xs text-red-600 underline">Delete</button>
              </div>
            </li>
          ))}
          {events.length === 0 && <p className="text-sm text-gray-400 py-2">No events yet.</p>}
        </ul>
      </div>
    </div>
  );
}

function AdvertisementsTab({ tenantSlug, token }) {
  const [ads, setAds] = useState([]);
  const [file, setFile] = useState(null);
  const [targetLink, setTargetLink] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function refresh() {
    apiClient.get(`/portal/${tenantSlug}/admin/advertisements`, { headers: authHeaders(token) }).then((res) => setAds(res.data));
  }
  useEffect(refresh, [tenantSlug, token]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!file) return setError('Choose a banner image.');
    setSaving(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      // Don't set Content-Type manually for FormData — axios needs to add its own
      // multipart boundary, otherwise the server can't parse the uploaded file.
      const { data: uploaded } = await apiClient.post(`/portal/${tenantSlug}/admin/upload`, form, {
        headers: authHeaders(token)
      });
      await apiClient.post(`/portal/${tenantSlug}/admin/advertisements`, { imageUrl: uploaded.url, targetLink }, { headers: authHeaders(token) });
      setFile(null); setTargetLink('');
      refresh();
    } catch (err) {
      setError(errorMessage(err));
    }
    setSaving(false);
  }

  async function toggleActive(ad) {
    await apiClient.patch(`/portal/${tenantSlug}/admin/advertisements/${ad._id}`, { isActive: !ad.isActive }, { headers: authHeaders(token) });
    refresh();
  }

  async function handleDelete(id) {
    await apiClient.delete(`/portal/${tenantSlug}/admin/advertisements/${id}`, { headers: authHeaders(token) });
    refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleAdd} className="bg-white rounded-lg shadow-md p-4 flex flex-col gap-2 max-w-lg">
        <h2 className="font-bold text-gray-800">Add advertisement banner</h2>
        <div>
          <input type="file" accept="image/*" className="text-sm" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <p className="text-xs text-gray-400 mt-1">Banner image — recommend 16:9, {FILE_HINT}</p>
        </div>
        <input
          className="border rounded px-3 py-2 text-sm"
          placeholder="Target link (optional)"
          maxLength={300}
          value={targetLink}
          onChange={(e) => setTargetLink(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={saving} className="self-start bg-purple-600 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50">
          {saving ? 'Uploading…' : 'Add banner'}
        </button>
      </form>

      <div className="grid sm:grid-cols-2 gap-3">
        {ads.map((ad) => (
          <div key={ad._id} className="bg-white rounded-lg shadow-md p-3 flex flex-col gap-2">
            <img src={ad.imageUrl} alt="Banner" className="rounded w-full h-32 object-cover" />
            <div className="flex justify-between items-center text-xs">
              <span className={`px-2 py-1 rounded-full font-semibold ${ad.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                {ad.isActive ? 'Active' : 'Hidden'}
              </span>
              <div className="flex gap-2">
                <button onClick={() => toggleActive(ad)} className="underline text-gray-600">{ad.isActive ? 'Hide' : 'Show'}</button>
                <button onClick={() => handleDelete(ad._id)} className="underline text-red-600">Delete</button>
              </div>
            </div>
          </div>
        ))}
        {ads.length === 0 && <p className="text-sm text-gray-400">No banners yet.</p>}
      </div>
    </div>
  );
}

function DonationsTab({ tenantSlug, token, socket }) {
  const [donations, setDonations] = useState([]);

  function refresh() {
    apiClient.get(`/portal/${tenantSlug}/admin/donations`, { headers: authHeaders(token) }).then((res) => setDonations(res.data));
  }
  useEffect(refresh, [tenantSlug, token]);

  useEffect(() => {
    if (!socket) return;
    const handler = (updated) => setDonations((list) => {
      const exists = list.some((d) => d._id === updated._id);
      return exists ? list.map((d) => (d._id === updated._id ? updated : d)) : [updated, ...list];
    });
    socket.on('donation-update', handler);
    return () => socket.off('donation-update', handler);
  }, [socket]);

  async function setStatus(id, status) {
    await apiClient.patch(`/portal/${tenantSlug}/admin/donations/${id}`, { status }, { headers: authHeaders(token) });
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 overflow-x-auto">
      <h2 className="font-bold text-gray-800 mb-3">Donations ({donations.length})</h2>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b text-xs uppercase text-gray-500">
            <th className="py-2">Donor</th><th>Phone</th><th>Amount</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {donations.map((d) => (
            <tr key={d._id} className="border-b last:border-0">
              <td className="py-2">{d.donorName}</td>
              <td>{d.donorPhone}</td>
              <td>₹{d.amount.toLocaleString()}</td>
              <td>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  d.status === 'RECEIVED' ? 'bg-green-100 text-green-700' : d.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>{d.status}</span>
              </td>
              <td className="flex gap-2 py-2">
                {d.status === 'PENDING' && (
                  <>
                    <button onClick={() => setStatus(d._id, 'RECEIVED')} className="text-xs text-green-700 underline">Receive</button>
                    <button onClick={() => setStatus(d._id, 'REJECTED')} className="text-xs text-red-700 underline">Reject</button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {donations.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-gray-400">No donations yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function GalleryTab({ tenantSlug, token, socket }) {
  const [photos, setPhotos] = useState([]);

  function refresh() {
    apiClient.get(`/portal/${tenantSlug}/admin/gallery`, { headers: authHeaders(token) }).then((res) => setPhotos(res.data));
  }
  useEffect(refresh, [tenantSlug, token]);

  useEffect(() => {
    if (!socket) return;
    const handler = (updated) => setPhotos((list) => {
      const exists = list.some((p) => p._id === updated._id);
      return exists ? list.map((p) => (p._id === updated._id ? updated : p)) : [updated, ...list];
    });
    socket.on('gallery-update', handler);
    return () => socket.off('gallery-update', handler);
  }, [socket]);

  async function setStatus(id, status) {
    await apiClient.patch(`/portal/${tenantSlug}/admin/gallery/${id}`, { status }, { headers: authHeaders(token) });
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="font-bold text-gray-800 mb-3">Gallery moderation ({photos.length})</h2>
      <div className="grid sm:grid-cols-3 gap-3">
        {photos.map((p) => (
          <div key={p._id} className="border rounded-lg overflow-hidden flex flex-col">
            <img src={p.watermarkedImageUrl} alt={p.caption || 'Submission'} className="w-full h-40 object-cover" />
            <div className="p-2 flex flex-col gap-1">
              <p className="text-xs text-gray-600">{p.uploaderName} · {p.uploaderPhone}</p>
              <span className={`self-start px-2 py-0.5 rounded-full text-xs font-semibold ${
                p.status === 'APPROVED' ? 'bg-green-100 text-green-700' : p.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              }`}>{p.status}</span>
              {p.status === 'PENDING' && (
                <div className="flex gap-2 mt-1">
                  <button onClick={() => setStatus(p._id, 'APPROVED')} className="text-xs text-green-700 underline">Approve</button>
                  <button onClick={() => setStatus(p._id, 'REJECTED')} className="text-xs text-red-700 underline">Reject</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {photos.length === 0 && <p className="text-sm text-gray-400">No submissions yet.</p>}
      </div>
    </div>
  );
}

function AartiTab({ tenantSlug, token }) {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  async function handleTrigger() {
    setStatus('sending');
    try {
      await apiClient.post(`/portal/${tenantSlug}/admin/aarti/trigger`, { message }, { headers: authHeaders(token) });
      setStatus('Alert sent to everyone currently on the portal.');
    } catch (err) {
      setStatus(errorMessage(err));
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex flex-col gap-3 max-w-md">
      <h2 className="font-bold text-gray-800">🔔 Trigger Aarti alert</h2>
      <textarea
        className="border rounded px-3 py-2 text-sm"
        rows={2}
        placeholder="🙏 Aarti time! Join us now."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={handleTrigger} disabled={status === 'sending'} className="self-start bg-orange-600 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50">
        Send alert
      </button>
      {status && status !== 'sending' && <p className="text-sm text-gray-600">{status}</p>}
    </div>
  );
}

const TABS = [
  { key: 'branding', label: 'Branding', Component: BrandingTab },
  { key: 'audio', label: 'Audio', Component: AudioTab },
  { key: 'events', label: 'Schedule', Component: EventsTab },
  { key: 'ads', label: 'Ads', Component: AdvertisementsTab },
  { key: 'donations', label: 'Donations', Component: DonationsTab },
  { key: 'gallery', label: 'Gallery', Component: GalleryTab },
  { key: 'aarti', label: 'Aarti', Component: AartiTab }
];

export default function TenantAdminDashboard() {
  const { tenantSlug } = useParams();
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey(tenantSlug)));
  const [activeTab, setActiveTab] = useState('branding');
  const { socket } = useSocket(token ? tenantSlug : null);

  if (!token) return <LoginForm tenantSlug={tenantSlug} onLogin={setToken} />;

  function handleLogout() {
    localStorage.removeItem(tokenKey(tenantSlug));
    setToken(null);
  }

  const ActiveComponent = TABS.find((t) => t.key === activeTab)?.Component;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <header className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">🙏 {tenantSlug} · Admin</h1>
          <button onClick={handleLogout} className="text-sm text-gray-500 underline">Log out</button>
        </header>

        <nav className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                activeTab === t.key ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 border'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {ActiveComponent && <ActiveComponent tenantSlug={tenantSlug} token={token} socket={socket} />}
      </div>
    </div>
  );
}
