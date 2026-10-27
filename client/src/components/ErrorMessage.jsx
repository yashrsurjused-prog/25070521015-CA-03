function ErrorMessage({ title = 'Something went wrong', message, onDismiss }) {
  if (!message && !title) {
    return null;
  }

  return (
    <div className="alert alert--error" role="alert">
      <div className="alert__icon" aria-hidden="true">
        !
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
          aria-label="Dismiss error"
        >
          &times;
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
