function PageLoader({ label = 'Loading...' }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="page-loader__spinner" aria-hidden="true" />
      <span className="page-loader__label">{label}</span>
    </div>
  );
}

export default PageLoader;
