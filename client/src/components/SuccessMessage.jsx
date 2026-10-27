function SuccessMessage({ title = 'Success', message, onDismiss }) {
  if (!message && !title) {
    return null;
  }

  return (
    <div className="alert alert--success" role="status">
      <div className="alert__icon" aria-hidden="true">
        &#10003;
      </div>
      <div className="alert__content">
        {title && <strong className="alert__title">{title}</strong>}
        {message && <p className="alert__message">{message}</p>}
      </div>
      {onDismiss && (
        <button
          className="alert__dismiss"
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
        >
          &times;
        </button>
      )}
    </div>
  );
}

export default SuccessMessage;
