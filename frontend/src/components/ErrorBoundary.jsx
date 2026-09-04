import { Component } from 'react';

// A crash in any one page (a bad API response shape, a null ref, etc.) would
// otherwise unmount the whole React tree and leave a blank white screen with
// no way back — this catches render/lifecycle errors below it and offers a reload.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '2rem',
          textAlign: 'center',
          background: 'var(--spotify-black, #121212)',
          color: 'var(--spotify-text, #fff)'
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Something went wrong</h1>
        <p style={{ color: 'var(--spotify-gray, #b3b3b3)', maxWidth: '28rem' }}>
          This page hit an unexpected error. Try reloading — if it keeps happening, please let us know.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '0.6rem 1.5rem',
            borderRadius: '9999px',
            border: 'none',
            background: '#1db954',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}
