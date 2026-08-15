import React from 'react';

interface LoaderProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  fullScreen?: boolean;
}

export function TopWaveLoader() {
  return (
    <div className="top-wave-loader" role="progressbar" aria-label="Loading workspace data">
      <div className="top-wave-bar" />
    </div>
  );
}

export function FullPageLoader({
  title = "Loading, please wait",
  subtitle = "We're preparing the workspace and syncing your latest data.",
  badge = "Loading",
  fullScreen = true,
}: LoaderProps) {
  return (
    <>
      <TopWaveLoader />
      {fullScreen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99998,
            background: 'rgba(14, 12, 9, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              padding: '24px 36px',
              borderRadius: '16px',
              background: 'rgba(25, 22, 18, 0.95)',
              border: '1px solid rgba(201, 168, 76, 0.2)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div style={{ width: '180px', height: '4px', background: 'rgba(201,168,76,0.15)', borderRadius: '2px', overflow: 'hidden' }}>
              <div className="top-wave-bar" />
            </div>
            <span style={{ color: '#e8d5a3', fontWeight: 600, fontSize: '0.9rem', letterSpacing: '0.05em' }}>{title}</span>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{subtitle}</span>
          </div>
        </div>
      )}
    </>
  );
}

export function InlineLoader({ text = "Loading data..." }: { text?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '24px 16px', color: '#94a3b8' }}>
      <div style={{ width: '120px', height: '3px', borderRadius: '2px', overflow: 'hidden', background: 'rgba(201,168,76,0.15)' }}>
        <div className="top-wave-bar" />
      </div>
      <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{text}</span>
    </div>
  );
}

export function Spinner() {
  return <span className="btn-wave-loader" />;
}

export default FullPageLoader;
