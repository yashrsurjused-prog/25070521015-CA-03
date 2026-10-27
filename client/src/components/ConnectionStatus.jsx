import { useEffect, useState } from 'react';
import { checkHealth } from '../services/api';

const STATUS_LABELS = {
  checking: 'Checking connection...',
  online: 'Backend connected',
  offline: 'Backend unavailable',
};

async function getConnectionResult() {
  try {
    const data = await checkHealth();
    return { status: 'online', message: data.message };
  } catch (error) {
    return { status: 'offline', message: error.message };
  }
}

function ConnectionStatus() {
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let ignore = false;

    getConnectionResult().then((result) => {
      if (!ignore) {
        setStatus(result.status);
        setMessage(result.message);
      }
    });

    return () => {
      ignore = true;
    };
  }, []);

  const handleRetry = () => {
    setStatus('checking');
    setMessage('');

    getConnectionResult().then((result) => {
      setStatus(result.status);
      setMessage(result.message);
    });
  };

  return (
    <div className={`connection connection--${status}`}>
      <span className="connection__dot" aria-hidden="true" />
      <div className="connection__text">
        <strong>{STATUS_LABELS[status]}</strong>
        {message && <span className="connection__message">{message}</span>}
      </div>
      <button
        className="connection__retry"
        type="button"
        onClick={handleRetry}
        disabled={status === 'checking'}
      >
        Retry
      </button>
    </div>
  );
}

export default ConnectionStatus;
