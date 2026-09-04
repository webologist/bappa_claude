import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient, authHeaders, errorMessage, mediaUrl } from '../api/client';
import { useSocket } from '../hooks/useSocket';
import { getTheme } from '../themes';
import LyricsViewer from '../components/LyricsViewer';
import WatermarkCamera from '../components/WatermarkCamera';
import RegisterGate from '../components/RegisterGate';
import {
  HomeIcon, MusicIcon, CalendarIcon, ImageIcon, HeartIcon, BellIcon, LockIcon, PlusIcon, CloseIcon,
  ChevronLeftIcon, ChevronRightIcon, ListIcon, ChevronDownIcon, SunIcon, MoonIcon
} from '../components/Icons';

const TABS = [
  { key: 'home', label: 'Home', Icon: HomeIcon },
  { key: 'aarti', label: 'Aarti', Icon: MusicIcon },
  { key: 'schedule', label: 'Schedule', Icon: CalendarIcon },
  { key: 'gallery', label: 'Gallery', Icon: ImageIcon },
  { key: 'donate', label: 'Donate', Icon: HeartIcon }
];

const GALLERY_VIEWS = [
  { key: 'list', label: 'List' },
  { key: 'small', label: 'Small' },
  { key: 'medium', label: 'Medium' },
  { key: 'large', label: 'Large' }
];

function gradientStyle(theme) {
  return { background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` };
}

// Tracks which item is centered in a horizontally-scrolling row, for dot navigation.
function useScrollDots(count) {
  const ref = useRef(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || count <= 1) return;
    function onScroll() {
      const first = el.children[0];
      if (!first) return;
      const style = getComputedStyle(el);
      const gap = parseFloat(style.columnGap || style.gap || '0') || 0;
      const step = first.getBoundingClientRect().width + gap;
      if (!step) return;
      const idx = Math.round(el.scrollLeft / step);
      setActive(Math.min(count - 1, Math.max(0, idx)));
    }
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [count]);

  return [ref, active];
}

function ScrollDots({ count, active }) {
  if (count <= 1) return null;
  return (
    <div className="flex justify-center gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all ${i === active ? 'w-4 bg-spotify-text' : 'w-1.5 bg-spotify-dark3'}`}
        />
      ))}
    </div>
  );
}

function dateKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function formatFullDay(key) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = dateKey(new Date().toISOString());
  const tomorrow = dateKey(new Date(Date.now() + 86400000).toISOString());
  const short = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (key === today) return `Today, ${short}`;
  if (key === tomorrow) return `Tomorrow, ${short}`;
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}
function formatEventDay(iso) {
  const key = dateKey(iso);
  const today = dateKey(new Date().toISOString());
  const tomorrow = dateKey(new Date(Date.now() + 86400000).toISOString());
  if (key === today) return 'Today';
  if (key === tomorrow) return 'Tomorrow';
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
function formatTimeRange(start, end) {
  const opts = { hour: 'numeric', minute: '2-digit' };
  return `${new Date(start).toLocaleTimeString(undefined, opts)} – ${new Date(end).toLocaleTimeString(undefined, opts)}`;
}

function TopBar({ tenant, tenantSlug, theme, colorMode, onToggleColorMode }) {
  return (
    <header className="sticky top-0 z-30 bg-spotify-black/95 backdrop-blur px-4 py-3 flex items-center gap-3">
      {tenant.logoUrl ? (
        <img src={mediaUrl(tenant.logoUrl)} alt={tenant.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0" style={gradientStyle(theme)}>🙏</div>
      )}
      <h1 className="flex-1 font-bold text-spotify-text truncate text-xl">{tenant.name}</h1>
      <button
        onClick={onToggleColorMode}
        className="w-8 h-8 rounded-full bg-spotify-dark2 flex items-center justify-center text-spotify-gray shrink-0"
        aria-label={colorMode === 'light' ? 'Switch to dark view' : 'Switch to light view'}
      >
        {colorMode === 'light' ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
      </button>
      <Link
        to={`/portal/${tenantSlug}/admin`}
        className="w-8 h-8 rounded-full bg-spotify-dark2 flex items-center justify-center text-spotify-gray shrink-0"
        aria-label="Admin login"
      >
        <LockIcon className="w-4 h-4" />
      </Link>
    </header>
  );
}

function BottomNav({ tab, setTab }) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 bg-spotify-black border-t border-spotify-dark3 flex justify-around max-w-md mx-auto"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map(({ key, label, Icon }) => (
        <button
          key={key}
          onClick={() => setTab(key)}
          className={`flex flex-col items-center gap-0.5 py-2 px-3 flex-1 text-[11px] font-medium transition ${
            tab === key ? 'text-spotify-text' : 'text-spotify-gray'
          }`}
        >
          <Icon className="w-6 h-6" />
          {label}
        </button>
      ))}
    </nav>
  );
}

function ToastBanner({ alert, onDismiss }) {
  return (
    <div className="fixed top-3 inset-x-3 z-50 max-w-sm mx-auto bg-spotify-dark2 border border-spotify-dark3 text-spotify-text rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
      <BellIcon className="w-5 h-5 text-orange-400 shrink-0" />
      <p className="flex-1 text-sm">{alert.message}</p>
      <button onClick={onDismiss} className="text-xs underline text-spotify-gray shrink-0">Dismiss</button>
    </div>
  );
}

function CameraSheet({ tenantSlug, endUser, onRegistered, onClose, onUploaded }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-spotify-dark w-full max-w-md rounded-t-3xl p-4 max-h-[85vh] overflow-y-auto"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1.5 rounded-full bg-spotify-dark3" />
        </div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-spotify-text">Share a photo</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-spotify-dark2 flex items-center justify-center text-spotify-text">
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
        {endUser ? (
          <WatermarkCamera
            tenantSlug={tenantSlug}
            token={endUser.token}
            uploaderName={`${endUser.user.firstName} ${endUser.user.lastName}`}
            uploaderPhone={endUser.user.phone}
            onUploaded={(p) => { onUploaded(p); onClose(); }}
          />
        ) : (
          <RegisterGate tenantSlug={tenantSlug} onSuccess={onRegistered} />
        )}
      </div>
    </div>
  );
}

function EventCard({ ev, showDate }) {
  return (
    <div className="bg-spotify-dark2 rounded-lg p-4 flex gap-3">
      <div className="w-14 shrink-0 text-center">
        {showDate && <p className="text-[10px] font-semibold text-orange-400 uppercase leading-tight">{formatEventDay(ev.startTime)}</p>}
        <p className="text-xs text-spotify-gray">{new Date(ev.startTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</p>
      </div>
      <div className="border-l border-spotify-dark3 pl-3 flex-1">
        <p className="font-semibold text-spotify-text">{ev.title}</p>
        {ev.description && <p className="text-sm text-spotify-gray mt-0.5">{ev.description}</p>}
        <p className="text-xs text-spotify-gray mt-1">{formatTimeRange(ev.startTime, ev.endTime)}</p>
      </div>
    </div>
  );
}

function ScheduleTab({ events }) {
  const [viewMode, setViewMode] = useState('day'); // 'day' | 'list'
  const days = [...new Set(events.map((ev) => dateKey(ev.startTime)))].sort();
  const todayKey = dateKey(new Date().toISOString());
  const [dayIndex, setDayIndex] = useState(() => {
    const idx = days.findIndex((d) => d >= todayKey);
    return idx === -1 ? Math.max(days.length - 1, 0) : idx;
  });

  if (days.length === 0) {
    return <p className="text-center text-spotify-gray py-10">No events scheduled yet.</p>;
  }

  const dayEvents = events.filter((ev) => dateKey(ev.startTime) === days[dayIndex]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end gap-1.5">
        <button
          onClick={() => setViewMode('list')}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition ${viewMode === 'list' ? 'bg-spotify-text text-spotify-black' : 'bg-spotify-dark2 text-spotify-gray'}`}
          aria-label="List view"
        >
          <ListIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewMode('day')}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition ${viewMode === 'day' ? 'bg-spotify-text text-spotify-black' : 'bg-spotify-dark2 text-spotify-gray'}`}
          aria-label="Day view"
        >
          <CalendarIcon className="w-4 h-4" />
        </button>
      </div>

      {viewMode === 'day' ? (
        <>
          <div className="flex items-center justify-between bg-spotify-dark2 rounded-lg px-1 py-1">
            <button
              onClick={() => setDayIndex((i) => Math.max(0, i - 1))}
              disabled={dayIndex === 0}
              className="w-9 h-9 rounded-full flex items-center justify-center text-spotify-text disabled:opacity-30"
              aria-label="Previous day"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <p className="font-semibold text-spotify-text text-sm">{formatFullDay(days[dayIndex])}</p>
            <button
              onClick={() => setDayIndex((i) => Math.min(days.length - 1, i + 1))}
              disabled={dayIndex === days.length - 1}
              className="w-9 h-9 rounded-full flex items-center justify-center text-spotify-text disabled:opacity-30"
              aria-label="Next day"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
          {dayEvents.map((ev) => <EventCard key={ev._id} ev={ev} />)}
        </>
      ) : (
        events.map((ev) => <EventCard key={ev._id} ev={ev} showDate />)
      )}
    </div>
  );
}

function GalleryTab({ photos, onShare }) {
  const [viewMode, setViewMode] = useState(() => {
    try { return localStorage.getItem('galleryViewMode') || 'medium'; } catch { return 'medium'; }
  });

  useEffect(() => {
    try { localStorage.setItem('galleryViewMode', viewMode); } catch { /* ignore */ }
  }, [viewMode]);

  const colsClass = { small: 'grid-cols-4', medium: 'grid-cols-3', large: 'grid-cols-2' }[viewMode];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end gap-1.5">
        {GALLERY_VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => setViewMode(v.key)}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition ${
              viewMode === v.key ? 'bg-spotify-text text-spotify-black' : 'bg-spotify-dark2 text-spotify-gray'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {photos.length === 0 && <p className="text-center text-spotify-gray py-10">No photos yet. Tap the + button to share one!</p>}

      {viewMode === 'list' ? (
        <div className="flex flex-col gap-2">
          {photos.map((p) => (
            <div key={p._id} className="bg-spotify-dark2 rounded-lg p-2 flex items-center gap-3">
              <img src={mediaUrl(p.watermarkedImageUrl)} alt={p.caption || 'Photo'} className="w-14 h-14 rounded object-cover shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-spotify-text truncate">{p.uploaderName}</p>
                {p.caption && <p className="text-xs text-spotify-gray truncate">{p.caption}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid gap-2 ${colsClass}`}>
          {photos.map((p) => (
            <img key={p._id} src={mediaUrl(p.watermarkedImageUrl)} alt={p.caption || 'Photo'} className="rounded-lg object-cover aspect-square" />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PortalHome() {
  const { tenantSlug } = useParams();
  const { socket } = useSocket(tenantSlug);
  const audioRef = useRef(null);

  const [tab, setTab] = useState('home');
  const [showCamera, setShowCamera] = useState(false);
  const [tenant, setTenant] = useState(null);
  const [audio, setAudio] = useState([]);
  const [events, setEvents] = useState([]);
  const [ads, setAds] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [selectedAudioId, setSelectedAudioId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [alert, setAlert] = useState(null);
  const [amount, setAmount] = useState('');
  const [donationStatus, setDonationStatus] = useState('idle');
  const [error, setError] = useState('');
  const [endUser, setEndUser] = useState(() => {
    try {
      const raw = localStorage.getItem(`endUser_${tenantSlug}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [adsCollapsed, setAdsCollapsed] = useState(() => {
    try { return localStorage.getItem('sponsorAdsCollapsed') === 'true'; } catch { return false; }
  });
  const [aartiCollapsed, setAartiCollapsed] = useState(false);
  const [colorMode, setColorMode] = useState(() => {
    try { return localStorage.getItem('portalColorMode') || 'dark'; } catch { return 'dark'; }
  });

  useEffect(() => {
    try { localStorage.setItem('sponsorAdsCollapsed', String(adsCollapsed)); } catch { /* ignore */ }
  }, [adsCollapsed]);

  useEffect(() => {
    try { localStorage.setItem('portalColorMode', colorMode); } catch { /* ignore */ }
  }, [colorMode]);

  const [adsScrollRef, adsActiveDot] = useScrollDots(ads.length);
  const [tracksScrollRef, tracksActiveDot] = useScrollDots(audio.length);

  useEffect(() => {
    async function load() {
      try {
        const [tenantRes, audioRes, eventsRes, adsRes, galleryRes] = await Promise.all([
          apiClient.get(`/portal/${tenantSlug}`),
          apiClient.get(`/portal/${tenantSlug}/audio`),
          apiClient.get(`/portal/${tenantSlug}/events`),
          apiClient.get(`/portal/${tenantSlug}/advertisements`),
          apiClient.get(`/portal/${tenantSlug}/gallery`)
        ]);
        setTenant(tenantRes.data);
        setAudio(audioRes.data);
        setSelectedAudioId(audioRes.data[0]?._id || null);
        setEvents(eventsRes.data);
        setAds(adsRes.data);
        setGallery(galleryRes.data);
      } catch (err) {
        setError(errorMessage(err, 'This portal could not be loaded.'));
      }
    }
    load();
  }, [tenantSlug]);

  useEffect(() => {
    if (!socket) return;
    socket.on('aarti-alert', (payload) => setAlert(payload));
    return () => socket.off('aarti-alert');
  }, [socket]);

  const selectedAudio = audio.find((a) => a._id === selectedAudioId) || null;
  const theme = getTheme(tenant?.theme);

  function selectTrack(id) {
    setSelectedAudioId(id);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }

  // There's no persistent mini-player, so playback/scroll shouldn't keep silently
  // running once the user leaves the Aarti tab — stop it the moment they navigate away.
  useEffect(() => {
    if (tab === 'aarti') return;
    if (selectedAudio?.audioUrl) {
      audioRef.current?.pause();
    } else {
      setIsPlaying(false);
    }
  }, [tab]);

  // "Play" always starts the lyrics auto-scroll. When the track also has real audio,
  // it drives isPlaying via the <audio> element's own events; when it doesn't
  // (the normal case now — admins add lyrics-only Aartis), we just flip the flag
  // ourselves so Play/Pause still works as a scroll start/stop control.
  function togglePlay() {
    if (selectedAudio?.audioUrl) {
      const el = audioRef.current;
      if (!el) return;
      if (isPlaying) el.pause();
      else el.play().catch(() => {});
    } else {
      setIsPlaying((p) => !p);
    }
  }

  function seek(ratio) {
    const el = audioRef.current;
    if (!el || !duration) return;
    el.currentTime = ratio * duration;
  }

  async function handleDonate(e) {
    e.preventDefault();
    if (!amount || !endUser) return;
    setDonationStatus('sending');
    try {
      await apiClient.post(`/portal/${tenantSlug}/donations`, { amount }, { headers: authHeaders(endUser.token) });
      setDonationStatus('done');
      setAmount('');
    } catch (err) {
      setError(errorMessage(err));
      setDonationStatus('idle');
    }
  }

  function logoutEndUser() {
    try { localStorage.removeItem(`endUser_${tenantSlug}`); } catch { /* ignore */ }
    setEndUser(null);
  }

  if (error && !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-spotify-black p-6 text-center">
        <p className="text-lg text-spotify-text">{error}</p>
      </div>
    );
  }

  if (!tenant) {
    return <div className="min-h-screen flex items-center justify-center bg-spotify-black text-spotify-gray">Loading portal…</div>;
  }

  const approvedPhotos = gallery.filter((p) => p.status === 'APPROVED');

  return (
    <div
      data-theme={colorMode}
      className="min-h-screen bg-spotify-black flex flex-col"
      style={{ paddingBottom: 'calc(70px + env(safe-area-inset-bottom))' }}
    >
      {selectedAudio?.audioUrl && (
        <audio
          ref={audioRef}
          src={mediaUrl(selectedAudio.audioUrl)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          className="hidden"
        />
      )}

      {alert && <ToastBanner alert={alert} onDismiss={() => setAlert(null)} />}

      <TopBar
        tenant={tenant}
        tenantSlug={tenantSlug}
        theme={theme}
        colorMode={colorMode}
        onToggleColorMode={() => setColorMode((m) => (m === 'light' ? 'dark' : 'light'))}
      />

      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 flex flex-col gap-6">
        {error && <p className="text-sm text-red-400 bg-red-950 rounded-xl px-3 py-2">{error}</p>}

        {tab === 'home' && (
          <>
            {ads.length > 0 && (
              <section className="flex flex-col gap-2">
                <button
                  onClick={() => setAdsCollapsed((c) => !c)}
                  className="flex items-center justify-between text-xs font-semibold text-spotify-gray"
                >
                  <span>Sponsors</span>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform ${adsCollapsed ? '-rotate-90' : ''}`} />
                </button>
                {!adsCollapsed && (
                  <>
                    <div ref={adsScrollRef} className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4">
                      {ads.map((ad) => (
                        <a
                          key={ad._id}
                          href={ad.targetLink || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 w-72 rounded-lg overflow-hidden"
                        >
                          <img src={mediaUrl(ad.imageUrl)} alt="Sponsor" className="w-full object-cover max-h-40" />
                        </a>
                      ))}
                    </div>
                    <ScrollDots count={ads.length} active={adsActiveDot} />
                  </>
                )}
              </section>
            )}

            {audio.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="text-lg font-bold text-spotify-text">Aarti Tracks</h2>
                <div ref={tracksScrollRef} className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4">
                  {audio.map((a) => (
                    <button
                      key={a._id}
                      onClick={() => { selectTrack(a._id); setTab('aarti'); }}
                      className="shrink-0 w-32 flex flex-col gap-2 text-left active:opacity-80 transition"
                    >
                      {a.thumbnailUrl ? (
                        <img src={mediaUrl(a.thumbnailUrl)} alt="" className="w-32 h-32 rounded-lg object-cover shadow-lg" />
                      ) : (
                        <div className="w-32 h-32 rounded-lg flex items-center justify-center text-4xl shadow-lg" style={gradientStyle(theme)}>🙏</div>
                      )}
                      <p className="text-sm font-semibold text-spotify-text truncate">{a.title}</p>
                      <p className="text-xs text-spotify-gray">Aarti</p>
                    </button>
                  ))}
                </div>
                <ScrollDots count={audio.length} active={tracksActiveDot} />
              </section>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setTab('donate')} className="bg-spotify-dark2 rounded-lg overflow-hidden flex items-center gap-3 pr-3 active:bg-spotify-dark3 transition">
                <div className="w-14 h-14 flex items-center justify-center shrink-0" style={{ background: theme.primary }}><HeartIcon className="w-6 h-6 text-white" /></div>
                <span className="font-semibold text-spotify-text text-sm">Donate</span>
              </button>
              <button onClick={() => setShowCamera(true)} className="bg-spotify-dark2 rounded-lg overflow-hidden flex items-center gap-3 pr-3 active:bg-spotify-dark3 transition">
                <div className="w-14 h-14 flex items-center justify-center shrink-0" style={{ background: theme.secondary }}><ImageIcon className="w-6 h-6 text-white" /></div>
                <span className="font-semibold text-spotify-text text-sm">Share photo</span>
              </button>
            </div>

            {events.length > 0 && (
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-spotify-text">Program Schedule</h2>
                  {endUser && <button onClick={() => setTab('schedule')} className="text-xs font-semibold text-spotify-gray">View all →</button>}
                </div>
                {endUser ? (
                  <div className="flex flex-col gap-2">
                    {events.map((ev) => (
                      <div key={ev._id} className="bg-spotify-dark2 rounded-lg p-3 flex items-center gap-3">
                        <div className="w-14 shrink-0 text-center">
                          <p className="text-[10px] font-semibold text-orange-400 uppercase leading-tight">{formatEventDay(ev.startTime)}</p>
                          <p className="text-xs text-spotify-gray">{new Date(ev.startTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</p>
                        </div>
                        <p className="font-medium text-spotify-text text-sm truncate flex-1">{ev.title}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() => setTab('schedule')}
                    className="bg-spotify-dark2 rounded-lg p-3 flex items-center gap-3 text-left"
                  >
                    <LockIcon className="w-5 h-5 text-spotify-gray shrink-0" />
                    <span className="text-sm text-spotify-gray">Verify your mobile number to view the schedule</span>
                  </button>
                )}
              </section>
            )}
          </>
        )}

        {tab === 'aarti' && (
          <>
            <LyricsViewer
              track={selectedAudio}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              onTogglePlay={togglePlay}
              onSeek={seek}
              theme={theme}
              collapsed={aartiCollapsed}
              onToggleCollapsed={() => setAartiCollapsed((c) => !c)}
            />
            {audio.length > 1 && !aartiCollapsed && (
              <div className="relative">
                <select
                  value={selectedAudioId || ''}
                  onChange={(e) => selectTrack(e.target.value)}
                  className="w-full appearance-none bg-spotify-dark2 text-spotify-text text-sm font-medium rounded-lg pl-3.5 pr-9 py-2.5 outline-none"
                >
                  {audio.map((a) => (
                    <option key={a._id} value={a._id}>{a.title}</option>
                  ))}
                </select>
                <ChevronDownIcon className="w-4 h-4 text-spotify-gray absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
          </>
        )}

        {tab === 'schedule' && (
          !endUser ? (
            <RegisterGate tenantSlug={tenantSlug} onSuccess={setEndUser} />
          ) : (
            <ScheduleTab events={events} />
          )
        )}

        {tab === 'gallery' && <GalleryTab photos={approvedPhotos} />}

        {tab === 'donate' && (
          !endUser ? (
            <RegisterGate tenantSlug={tenantSlug} onSuccess={setEndUser} />
          ) : (
            <div className="bg-spotify-dark2 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-spotify-text">💝 Submit a Donation</h2>
              </div>
              <p className="text-xs text-spotify-gray -mt-2 mb-3">
                Donating as <span className="text-spotify-text font-semibold">{endUser.user.firstName} {endUser.user.lastName}</span>
                {' · '}<button onClick={logoutEndUser} className="underline">Not you?</button>
              </p>
              {donationStatus === 'done' ? (
                <p className="text-spotify-green text-sm">Thank you! Your donation has been logged as pending.</p>
              ) : (
                <form onSubmit={handleDonate} className="flex flex-col gap-2.5">
                  <input className="bg-spotify-dark3 text-spotify-text placeholder-spotify-gray rounded-xl px-3.5 py-2.5 text-sm outline-none" placeholder="Amount (₹)" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  <button type="submit" disabled={donationStatus === 'sending'} className="bg-spotify-green text-black rounded-full py-3 font-bold disabled:opacity-50 active:scale-[0.99] transition">
                    {donationStatus === 'sending' ? 'Submitting…' : 'Submit'}
                  </button>
                </form>
              )}
            </div>
          )
        )}
      </main>

      {tab === 'gallery' && (
        <button
          onClick={() => setShowCamera(true)}
          className="fixed z-40 right-4 w-14 h-14 rounded-full bg-spotify-green text-black shadow-lg flex items-center justify-center active:scale-95 transition"
          style={{ bottom: 'calc(84px + env(safe-area-inset-bottom))' }}
          aria-label="Share a photo"
        >
          <PlusIcon className="w-7 h-7" />
        </button>
      )}

      <BottomNav tab={tab} setTab={setTab} />

      {showCamera && (
        <CameraSheet
          tenantSlug={tenantSlug}
          endUser={endUser}
          onRegistered={setEndUser}
          onClose={() => setShowCamera(false)}
          onUploaded={(photo) => setGallery((g) => [photo, ...g])}
        />
      )}
    </div>
  );
}
