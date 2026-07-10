export default function Loading() {
  return (
    <div className="loading-screen" aria-live="polite" aria-busy="true">
      <div className="loading-card" role="status" aria-label="Loading, please wait">
        <div className="loading-spinner" aria-hidden="true" />
        <div className="loading-badge">Loading</div>
        <h1 className="loading-title">Loading, please wait</h1>
        <p className="loading-copy">
          We’re preparing the workspace and syncing your latest data.
        </p>
        <div className="loading-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}