const STATUS_LABELS = {
  open: 'Open',
  pending: 'Pending',
  claimed: 'Claimed',
  under_review: 'Under review',
  in_progress: 'In progress',
  resolved: 'Resolved',
  returned: 'Returned',
  rejected: 'Rejected',
  lost: 'Lost',
  found: 'Found',
  approved: 'Approved',
  active: 'Active',
  inactive: 'Inactive',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const STATUS_TONES = {
  open: 'info',
  pending: 'warning',
  claimed: 'info',
  under_review: 'violet',
  in_progress: 'primary',
  resolved: 'success',
  returned: 'success',
  rejected: 'danger',
  lost: 'warning',
  found: 'info',
  approved: 'success',
  active: 'success',
  inactive: 'neutral',
  low: 'success',
  medium: 'warning',
  high: 'danger',
};

function StatusBadge({ status, label, className = '' }) {
  if (!status) {
    return null;
  }

  const tone = STATUS_TONES[status] || 'neutral';
  const displayLabel = label || STATUS_LABELS[status] || status;

  return (
    <span className={`status-badge status-badge--${tone} ${className}`.trim()}>
      <span className="status-badge__dot" aria-hidden="true" />
      {displayLabel}
    </span>
  );
}

export default StatusBadge;
