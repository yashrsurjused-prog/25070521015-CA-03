function EmptyState({
  title = 'Nothing here yet',
  message = 'There are no records to show right now.',
  action,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden="true">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M8 15h8M9.5 10h.01M14.5 10h.01" />
        </svg>
      </div>
      <h3>{title}</h3>
      <p>{message}</p>
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}

export default EmptyState;
