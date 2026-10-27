import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import AuthShell from '../components/AuthShell';
import Button from '../components/Button';
import ErrorMessage from '../components/ErrorMessage';
import InputField from '../components/InputField';
import useAuth from '../context/useAuth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialForm = {
  name: '',
  email: '',
  password: '',
  department: '',
  studentId: '',
};

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: '' }));
    setServerError('');
  };

  const validate = () => {
    const errors = {};
    const name = form.name.trim();
    const email = form.email.trim();
    const department = form.department.trim();
    const studentId = form.studentId.trim();
    const passwordBytes = new TextEncoder().encode(form.password).length;

    if (!name) {
      errors.name = 'Full name is required.';
    } else if (name.length < 2 || name.length > 100) {
      errors.name = 'Name must be between 2 and 100 characters.';
    }

    if (!email) {
      errors.email = 'Email is required.';
    } else if (!EMAIL_PATTERN.test(email)) {
      errors.email = 'Enter a valid email address.';
    }

    if (!form.password) {
      errors.password = 'Password is required.';
    } else if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    } else if (passwordBytes > 72) {
      errors.password = 'Password cannot exceed 72 bytes.';
    }

    if (department.length > 100) {
      errors.department = 'Department cannot exceed 100 characters.';
    }

    if (studentId.length > 50) {
      errors.studentId = 'Student ID cannot exceed 50 characters.';
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
      const email = form.email.trim().toLowerCase();

      await register({
        name: form.name.trim(),
        email,
        password: form.password,
        department: form.department.trim() || undefined,
        studentId: form.studentId.trim() || undefined,
      });

      navigate('/login', {
        replace: true,
        state: { registered: true, email },
      });
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Student registration"
      title="Create your campus service account"
      description="Register once to submit complaints, browse lost-and-found listings, and follow service updates."
    >
      {serverError && (
        <ErrorMessage
          title="Unable to create account"
          message={serverError}
          onDismiss={() => setServerError('')}
        />
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-form__row">
          <InputField
            label="Full name"
            name="name"
            value={form.name}
            onChange={handleChange}
            error={fieldErrors.name}
            autoComplete="name"
            placeholder="Asha Sharma"
            required
          />
          <InputField
            label="Student ID"
            name="studentId"
            value={form.studentId}
            onChange={handleChange}
            error={fieldErrors.studentId}
            autoComplete="off"
            placeholder="Optional"
            hint="For example, STU-2026-001"
          />
        </div>

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
          label="Department"
          name="department"
          value={form.department}
          onChange={handleChange}
          error={fieldErrors.department}
          autoComplete="organization"
          placeholder="Optional"
        />

        <InputField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          error={fieldErrors.password}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="Use at least 8 characters. Passwords are hashed by the server."
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="auth-form__submit"
          loading={submitting}
        >
          Create student account
        </Button>
      </form>

      <p className="auth-card__switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>

      <p className="auth-card__legal">
        Student accounts only. Administrator accounts are created separately by
        campus staff.
      </p>
    </AuthShell>
  );
}

export default Register;
