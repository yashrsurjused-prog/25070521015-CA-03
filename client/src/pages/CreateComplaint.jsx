import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Button from '../components/Button';
import DashboardShell from '../components/DashboardShell';
import ErrorMessage from '../components/ErrorMessage';
import InputField from '../components/InputField';
import SuccessMessage from '../components/SuccessMessage';
import api, { getApiErrorMessage } from '../services/api';

const CATEGORIES = ['Maintenance', 'Cleanliness', 'Safety', 'Internet', 'Water', 'Other'];

function CreateComplaint() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setServerError('');
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = 'Title is required';
    if (form.title.trim().length > 150) nextErrors.title = 'Title cannot exceed 150 characters';
    if (!form.description.trim()) nextErrors.description = 'Description is required';
    if (form.description.trim().length > 2000) nextErrors.description = 'Description cannot exceed 2000 characters';
    if (!form.category) nextErrors.category = 'Category is required';
    if (!form.location.trim()) nextErrors.location = 'Location is required';
    if (form.location.trim().length > 200) nextErrors.location = 'Location cannot exceed 200 characters';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting || !validate()) return;

    setSubmitting(true);
    setServerError('');

    try {
      const response = await api.post('/api/complaints', {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        location: form.location.trim(),
      });

      setSuccessData({
        ticketId: response.data?.ticketId,
        complaintId: response.data?.complaint?._id,
      });
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Failed to submit complaint.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (successData) {
    return (
      <DashboardShell
        eyebrow="Complaints"
        title="Complaint submitted"
        description="Your complaint has been recorded."
      >
        <section className="panel">
          <SuccessMessage
            title="Success"
            message={`Complaint submitted successfully. Ticket ID: ${successData.ticketId}`}
          />
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            {successData.complaintId && (
              <Button onClick={() => navigate(`/complaints/${successData.complaintId}`)}>
                View complaint details
              </Button>
            )}
            <Button variant="secondary" onClick={() => navigate('/complaints')}>
              View all complaints
            </Button>
            <Button variant="ghost" onClick={() => navigate('/student/dashboard')}>
              Back to dashboard
            </Button>
          </div>
        </section>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      eyebrow="Complaints"
      title="Submit a Complaint"
      description="Report campus issues to the administration."
      actions={
        <Link to="/complaints">
          <Button variant="secondary">Back to My Complaints</Button>
        </Link>
      }
    >
      {serverError && <ErrorMessage title="Submission failed" message={serverError} onDismiss={() => setServerError('')} />}

      <section className="panel">
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <InputField
            label="Title"
            name="title"
            value={form.title}
            onChange={handleChange}
            error={errors.title}
            placeholder="Brief summary of the issue"
            required
          />
          <div className="input-field">
            <label className="input-field__label">
              Description <span className="input-field__required">*</span>
            </label>
            <textarea
              name="description"
              aria-label="Description"
              value={form.description}
              onChange={handleChange}
              className={`input-field__control ${errors.description ? 'input-field__control--error' : ''}`}
              rows={5}
              placeholder="Provide detailed information about the issue"
            />
            {errors.description && <p className="input-field__error">{errors.description}</p>}
          </div>
          <div className="form-row">
            <div className="select-field">
              <label className="input-field__label">
                Category <span className="input-field__required">*</span>
              </label>
              <select name="category" aria-label="Category" value={form.category} onChange={handleChange} className="input-field__control">
                <option value="">Select category</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && <p className="input-field__error">{errors.category}</p>}
            </div>
            <InputField
              label="Campus Location"
              name="location"
              value={form.location}
              onChange={handleChange}
              error={errors.location}
              placeholder="Building, room, area..."
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button type="submit" variant="primary" loading={submitting}>
              Submit Complaint
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/complaints')}>
              Cancel
            </Button>
          </div>
        </form>
      </section>
    </DashboardShell>
  );
}

export default CreateComplaint;
