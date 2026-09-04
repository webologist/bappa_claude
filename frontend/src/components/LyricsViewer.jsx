import { useEffect, useRef, useState } from 'react';
import { PlayIcon, PauseIcon, ListIcon } from './Icons';
import { getTheme } from '../themes';

const LANGUAGES = [
  { key: 'marathi', label: 'मराठी' },
  { key: 'gujarati', label: 'ગુજરાતી' },
  { key: 'english', label: 'English' }
];

const MIN_FONT = 16;
const MAX_FONT = 34;

function formatTime(sec) {
  if (!Number.isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Presentational "Now Playing" view. Playback state (isPlaying, currentTime, duration)
// lives in PortalHome so it keeps running when the user switches tabs. When the track
// has no audio, `isPlaying` just means "auto-scrolling" — pressing Play always starts
// the scroll, whether or not real audio is behind it.
export default function LyricsViewer({ track, isPlaying, currentTime, duration, onTogglePlay, onSeek, theme, collapsed, onToggleCollapsed }) {
  const resolvedTheme = theme || getTheme();
  const [language, setLanguage] = useState('marathi');
  const [speed, setSpeed] = useState(2);
  const [fontSize, setFontSize] = useState(24);
  const lyricsRef = useRef(null);

  // Uses setInterval rather than requestAnimationFrame: rAF gets throttled/paused by
  // some browsers/embedded webviews when the tab isn't actively compositing, even
  // while it's technically "visible" — a timer keeps this working everywhere.
  useEffect(() => {
    if (!isPlaying) return;
    const el = lyricsRef.current;
    if (!el) return;

    const id = setInterval(() => {
      if (el.scrollTop + el.clientHeight < el.scrollHeight - 1) {
        el.scrollTop += speed * 2;
      }
    }, 100);
    return () => clearInterval(id);
  }, [isPlaying, speed, language, track?.title]);

  useEffect(() => {
    if (lyricsRef.current) lyricsRef.current.scrollTop = 0;
  }, [language, track?.title]);

  if (!track) {
    return <p className="text-center text-spotify-gray py-16">No Aarti tracks yet.</p>;
  }

  const text = track.lyrics?.[language]?.trim() || 'Lyrics not available in this language yet.';
  const hasAudio = !!track.audioUrl;
  const progress = duration ? currentTime / duration : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {!collapsed && (
          track.thumbnailUrl ? (
            <img src={track.thumbnailUrl} alt="" className="w-16 h-16 rounded-lg object-cover shadow-lg shrink-0" />
          ) : (
            <div
              className="w-16 h-16 rounded-lg shadow-lg flex items-center justify-center text-2xl shrink-0"
              style={{ background: `linear-gradient(135deg, ${resolvedTheme.primary}, ${resolvedTheme.secondary})` }}
            >
              🙏
            </div>
          )
        )}
        <div className="min-w-0 flex-1">
          {!collapsed && <p className="text-xs uppercase tracking-wide text-spotify-gray">Aarti</p>}
          <h2 className="text-lg font-bold text-spotify-text truncate">{track.title}</h2>
        </div>
        {onToggleCollapsed && (
          <button
            onClick={onToggleCollapsed}
            className="w-8 h-8 rounded-full bg-spotify-dark2 flex items-center justify-center text-spotify-text shrink-0"
            aria-label={collapsed ? 'Show controls' : 'Hide controls'}
          >
            <ListIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {!collapsed && hasAudio && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-spotify-gray tabular-nums w-9">{formatTime(currentTime)}</span>
          <input
            type="range" min="0" max="1" step="0.001"
            value={Number.isFinite(progress) ? progress : 0}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="flex-1 accent-spotify-green h-1"
          />
          <span className="text-xs text-spotify-gray tabular-nums w-9">{formatTime(duration)}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={onTogglePlay}
          className="w-12 h-12 rounded-full bg-spotify-green text-black flex items-center justify-center shadow-lg active:scale-95 transition shrink-0"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5 ml-0.5" />}
        </button>
        {!collapsed && (
          <label className="flex items-center gap-1.5 text-xs text-spotify-gray">
            Scroll speed
            <input
              type="range" min="1" max="5" step="1"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="accent-spotify-green w-16"
            />
            <span className="font-semibold w-4 text-spotify-text">{speed}x</span>
          </label>
        )}
      </div>

      {!collapsed && !hasAudio && <p className="text-xs text-spotify-gray -mt-1">Lyrics only · press play to auto-scroll</p>}

      {!collapsed && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-1.5">
            {LANGUAGES.map((l) => (
              <button
                key={l.key}
                onClick={() => setLanguage(l.key)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition border ${
                  language === l.key ? 'bg-spotify-text text-spotify-black border-spotify-text' : 'border-spotify-dark3 text-spotify-text'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setFontSize((f) => Math.max(MIN_FONT, f - 2))}
              disabled={fontSize <= MIN_FONT}
              className="w-6 h-6 rounded-full bg-spotify-dark2 text-spotify-text text-[10px] font-bold flex items-center justify-center disabled:opacity-30"
              aria-label="Decrease font size"
            >
              A
            </button>
            <button
              onClick={() => setFontSize((f) => Math.min(MAX_FONT, f + 2))}
              disabled={fontSize >= MAX_FONT}
              className="w-6 h-6 rounded-full bg-spotify-dark2 text-spotify-text text-sm font-bold flex items-center justify-center disabled:opacity-30"
              aria-label="Increase font size"
            >
              A
            </button>
          </div>
        </div>
      )}

      <div
        ref={lyricsRef}
        className={`whitespace-pre-wrap leading-relaxed text-spotify-text font-medium overflow-y-auto pb-10 pt-1 ${
          collapsed ? 'min-h-[72vh] max-h-[82vh]' : 'min-h-[55vh] max-h-[68vh]'
        }`}
        style={{ fontSize: `${fontSize}px` }}
      >
        {text}
      </div>
    </div>
  );
}
