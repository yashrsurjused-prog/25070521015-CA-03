import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import AuthShell from '../components/AuthShell';
import Button from '../components/Button';
import ErrorMessage from '../components/ErrorMessage';
import InputField from '../components/InputField';
import SuccessMessage from '../components/SuccessMessage';
import useAuth from '../context/useAuth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Login() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const registrationState = location.state;
  const [form, setForm] = useState({
    email: registrationState?.email || '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showRegisteredMessage, setShowRegisteredMessage] = useState(
    Boolean(registrationState?.registered),
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: '' }));
    setServerError('');
    setShowRegisteredMessage(false);
  };

  const validate = () => {
    const errors = {};
    const email = form.email.trim();

    if (!email) {
      errors.email = 'Email is required.';
    } else if (!EMAIL_PATTERN.test(email)) {
      errors.email = 'Enter a valid email address.';
    }

    if (!form.password) {
      errors.password = 'Password is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting || !validate()) {
      return;
    }

    setSubmitting(true);
    setServerError('');

    try {
      const result = await login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      const role = result.user?.role;
      const fromPath = location.state?.from?.pathname;
      const roleRoot = role === 'admin' ? '/admin' : '/student';
      const target =
        fromPath && fromPath.startsWith(roleRoot)
          ? fromPath
          : `${roleRoot}/dashboard`;

      navigate(target, { replace: true });
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in to your campus workspace"
      description="Use your campus account to manage complaints, recover items, and view service updates."
    >
      {showRegisteredMessage && (
        <SuccessMessage
          title="Student account created"
          message="Your account is ready. Log in with your email and password to continue."
          onDismiss={() => setShowRegisteredMessage(false)}
        />
      )}

      {serverError && (
        <ErrorMessage
          title="Unable to log in"
          message={serverError}
          onDismiss={() => setServerError('')}
        />
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <InputField
          label="Email address"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          error={fieldErrors.email}
          autoComplete="email"
          placeholder="you@college.edu"
          required
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          error={fieldErrors.password}
          autoComplete="current-password"
          placeholder="Enter your password"
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="auth-form__submit"
          loading={submitting}
        >
          Log in
        </Button>
      </form>

      <p className="auth-card__switch">
        New to the portal? <Link to="/register">Create a student account</Link>
      </p>

      <div className="auth-card__security">
        <svg
          className="auth-card__security-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="4" y="10" width="16" height="11" rx="2.5" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
        </svg>
        <span>Your password is securely verified and never shared.</span>
      </div>
    </AuthShell>
  );
}

export default Login;
