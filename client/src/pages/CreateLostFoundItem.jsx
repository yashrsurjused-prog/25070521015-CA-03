import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Button from '../components/Button';
import DashboardShell from '../components/DashboardShell';
import ErrorMessage from '../components/ErrorMessage';
import InputField from '../components/InputField';
import SuccessMessage from '../components/SuccessMessage';
import api, { getApiErrorMessage } from '../services/api';

const CATEGORIES = ['Books', 'Electronics', 'Clothing', 'ID Cards', 'Keys', 'Bags', 'Other'];
const TYPES = ['lost', 'found'];
const LOCATIONS = ['Library', 'Cafeteria', 'Hostel', 'Classroom', 'Parking', 'Lab', 'Other'];

function CreateLostFoundItem() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    type: '',
    category: '',
    description: '',
    location: '',
    eventDate: '',
    imageUrl: '',
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
    if (!form.type) nextErrors.type = 'Type is required';
    if (!form.category) nextErrors.category = 'Category is required';
    if (!form.description.trim()) nextErrors.description = 'Description is required';
    if (form.description.trim().length > 2000) nextErrors.description = 'Description cannot exceed 2000 characters';
    if (!form.location) nextErrors.location = 'Location is required';
    if (form.imageUrl.trim()) {
      try {
        const url = new URL(form.imageUrl.trim());
        if (!['http:', 'https:'].includes(url.protocol)) {
          nextErrors.imageUrl = 'Image URL must use http:// or https://';
        }
      } catch {
        nextErrors.imageUrl = 'Image URL must be a valid URL';
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting || !validate()) return;

    setSubmitting(true);
    setServerError('');

    try {
      const payload = {
        title: form.title.trim(),
        type: form.type,
        category: form.category,
        description: form.description.trim(),
        location: form.location,
      };
      if (form.eventDate) payload.eventDate = form.eventDate;
      if (form.imageUrl.trim()) payload.imageUrl = form.imageUrl.trim();

      const response = await api.post('/api/lost-found', payload);
      setSuccessData({
        itemId: response.data?.item?._id,
      });
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Failed to report item.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (successData) {
    return (
      <DashboardShell
        eyebrow="Lost & Found"
        title="Item reported"
        description="Your lost or found item has been posted."
      >
        <section className="panel">
          <SuccessMessage
            title="Success"
            message="Item reported successfully. It is now visible to other students."
          />
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            {successData.itemId && (
              <Button onClick={() => navigate(`/lost-found/${successData.itemId}`)}>
                View item details
              </Button>
            )}
            <Button variant="secondary" onClick={() => navigate('/lost-found')}>
              Browse lost &amp; found
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
      eyebrow="Lost & Found"
      title="Report Lost or Found Item"
      description="Post an item to help the campus community."
      actions={
        <Link to="/lost-found">
          <Button variant="secondary">Back to listings</Button>
        </Link>
      }
    >
      {serverError && <ErrorMessage title="Submission failed" message={serverError} onDismiss={() => setServerError('')} />}

      <section className="panel">
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <InputField
              label="Item title"
              name="title"
              value={form.title}
              onChange={handleChange}
              error={errors.title}
              placeholder="e.g., Black wallet"
              required
            />
            <div className="select-field">
              <label className="input-field__label">
                Type <span className="input-field__required">*</span>
              </label>
              <select name="type" aria-label="Type" value={form.type} onChange={handleChange} className="input-field__control">
                <option value="">Select type</option>
                {TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.type && <p className="input-field__error">{errors.type}</p>}
            </div>
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
            <div className="select-field">
              <label className="input-field__label">
                Location <span className="input-field__required">*</span>
              </label>
              <select name="location" aria-label="Location" value={form.location} onChange={handleChange} className="input-field__control">
                <option value="">Select location</option>
                {LOCATIONS.map((location) => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              {errors.location && <p className="input-field__error">{errors.location}</p>}
            </div>
          </div>
          <InputField
            label="Date lost/found"
            name="eventDate"
            type="date"
            value={form.eventDate}
            onChange={handleChange}
          />
          <InputField
            label="Image URL (optional)"
            name="imageUrl"
            value={form.imageUrl}
            onChange={handleChange}
            error={errors.imageUrl}
            placeholder="https://example.com/image.jpg"
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
              className="input-field__control"
              rows={5}
              placeholder="Describe the item, distinguishing features, etc."
            />
            {errors.description && <p className="input-field__error">{errors.description}</p>}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button type="submit" variant="primary" loading={submitting}>
              Report Item
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/lost-found')}>
              Cancel
            </Button>
          </div>
        </form>
      </section>
    </DashboardShell>
  );
}

export default CreateLostFoundItem;
