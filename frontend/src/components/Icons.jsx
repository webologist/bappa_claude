function Icon({ children, className = 'w-6 h-6', filled = false }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export function HomeIcon(props) {
  return <Icon {...props}><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v9.5a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" /></Icon>;
}
export function MusicIcon(props) {
  return <Icon {...props}><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /><path d="M9 18V5l12-2v13" /></Icon>;
}
export function CalendarIcon(props) {
  return <Icon {...props}><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /></Icon>;
}
export function ImageIcon(props) {
  return <Icon {...props}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="M21 16l-5.5-5.5a1.5 1.5 0 0 0-2.1 0L4 19" /></Icon>;
}
export function HeartIcon(props) {
  return <Icon {...props}><path d="M12 20.5s-7.5-4.6-9.5-9A5 5 0 0 1 12 6.5 5 5 0 0 1 21.5 11.5c-2 4.4-9.5 9-9.5 9Z" /></Icon>;
}
export function CameraIcon(props) {
  return <Icon {...props}><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" /><circle cx="12" cy="14" r="3.5" /></Icon>;
}
export function BellIcon(props) {
  return <Icon {...props}><path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z" /><path d="M10 19a2 2 0 0 0 4 0" /></Icon>;
}
export function CloseIcon(props) {
  return <Icon {...props}><path d="M6 6l12 12M18 6 6 18" /></Icon>;
}
export function ShareIcon(props) {
  return <Icon {...props}><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.8 15.8 6.2M8.2 13.2l7.6 4.6" /></Icon>;
}
export function LockIcon(props) {
  return <Icon {...props}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Icon>;
}
export function PlayIcon(props) {
  return <Icon {...props} filled><path d="M8 5.5v13l11-6.5-11-6.5Z" /></Icon>;
}
export function PauseIcon(props) {
  return <Icon {...props} filled><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></Icon>;
}
export function PlusIcon(props) {
  return <Icon {...props}><path d="M12 5v14M5 12h14" /></Icon>;
}
export function ScrollIcon(props) {
  return <Icon {...props}><path d="M12 3v18M7 8l5-5 5 5M7 16l5 5 5-5" /></Icon>;
}
export function ChevronLeftIcon(props) {
  return <Icon {...props}><path d="M15 5l-7 7 7 7" /></Icon>;
}
export function ChevronRightIcon(props) {
  return <Icon {...props}><path d="M9 5l7 7-7 7" /></Icon>;
}
export function ListIcon(props) {
  return <Icon {...props}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></Icon>;
}
export function ChevronDownIcon(props) {
  return <Icon {...props}><path d="M6 9l6 6 6-6" /></Icon>;
}
export function SunIcon(props) {
  return <Icon {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Icon>;
}
export function MoonIcon(props) {
  return <Icon {...props}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" /></Icon>;
}
