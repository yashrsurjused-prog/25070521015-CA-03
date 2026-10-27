import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import DashboardShell from '../components/DashboardShell';
import ErrorMessage from '../components/ErrorMessage';
import InputField from '../components/InputField';
import PageLoader from '../components/PageLoader';
import SafeImage from '../components/SafeImage';
import StatusBadge from '../components/StatusBadge';
import SuccessMessage from '../components/SuccessMessage';
import { useAuth } from '../context/useAuth';
import api, { getApiErrorMessage } from '../services/api';

const CATEGORIES = ['Books', 'Electronics', 'Clothing', 'ID Cards', 'Keys', 'Bags', 'Other'];
const TYPES = ['lost', 'found'];
const LOCATIONS = ['Library', 'Cafeteria', 'Hostel', 'Classroom', 'Parking', 'Lab', 'Other'];

function formatDate(value) {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

function formatDateTime(value) {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function LostFoundDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: '',
    category: '',
    description: '',
    location: '',
    eventDate: '',
    imageUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimMessage, setClaimMessage] = useState('');
  const [claiming, setClaiming] = useState(false);

  const fetchItem = useCallback(async () => {
    try {
      const response = await api.get(`/api/lost-found/${id}`);
      const data = response.data?.item;
      setItem(data);
      setForm({
        title: data?.title || '',
        type: data?.type || '',
        category: data?.category || '',
        description: data?.description || '',
        location: data?.location || '',
        eventDate: data?.eventDate ? new Date(data.eventDate).toISOString().slice(0, 10) : '',
        imageUrl: data?.imageUrl || '',
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load item details.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        title: form.title.trim(),
        type: form.type,
        category: form.category,
        description: form.description.trim(),
        location: form.location,
      };
      if (form.eventDate) payload.eventDate = form.eventDate;
      else payload.eventDate = null;
      if (form.imageUrl.trim()) payload.imageUrl = form.imageUrl.trim();
      else payload.imageUrl = null;

      const response = await api.patch(`/api/lost-found/${id}`, payload);
      setItem(response.data?.item);
      setEditing(false);
      setSuccess('Item updated successfully.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update item.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError('');

    try {
      await api.delete(`/api/lost-found/${id}`);
      navigate('/lost-found');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to delete item.'));
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const handleClaim = async () => {
    setClaiming(true);
    setError('');
    setSuccess('');

    try {
      await api.post(`/api/lost-found/${id}/claim`, {
        message: claimMessage.trim() || undefined,
      });
      setClaimOpen(false);
      setClaimMessage('');
      setSuccess('Claim request submitted successfully. It requires administrator verification.');
      fetchItem();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to submit claim.'));
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell eyebrow="Lost & Found" title="Item Details">
        <PageLoader label="Loading item details..." />
      </DashboardShell>
    );
  }

  if (error && !item) {
    return (
      <DashboardShell eyebrow="Lost & Found" title="Item Details">
        <ErrorMessage title="Error" message={error} />
        <div style={{ marginTop: '1rem' }}>
          <Link to="/lost-found">
            <Button variant="secondary">Back to listings</Button>
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const isOwner = item?.reportedBy?._id === user?.id || item?.reportedBy === user?.id;
  const canEditDelete = isOwner && item?.status === 'open';
  const hasActiveClaim = ['pending', 'approved'].includes(item?.claim?.status);
  const canClaim = !isOwner && item?.status === 'open' && !hasActiveClaim;

  return (
    <DashboardShell
      eyebrow="Lost & Found"
      title={item?.title}
      description="View item details and take action."
      actions={
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link to="/lost-found">
            <Button variant="secondary">Back to listings</Button>
          </Link>
          {canEditDelete && !editing && (
            <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
          )}
          {canEditDelete && !editing && (
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>Delete</Button>
          )}
          {canClaim && !editing && (
            <Button variant="primary" onClick={() => setClaimOpen(true)}>Submit claim</Button>
          )}
        </div>
      }
    >
      {error && <ErrorMessage title="Error" message={error} onDismiss={() => setError('')} />}
      {success && <SuccessMessage title="Success" message={success} onDismiss={() => setSuccess('')} />}

      <div className="dashboard-split">
        <section className="panel">
          <div className="panel__heading">
            <div>
              <span className="panel__eyebrow">Item details</span>
              <h2>Information</h2>
            </div>
            <StatusBadge status={item?.status} />
          </div>

          {editing ? (
            <div className="auth-form">
              <InputField label="Title" name="title" value={form.title} onChange={handleChange} />
              <div className="form-row">
                <div className="select-field">
                  <label className="input-field__label">Type</label>
                  <select name="type" aria-label="Type" value={form.type} onChange={handleChange} className="input-field__control">
                    {TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div className="select-field">
                  <label className="input-field__label">Category</label>
                  <select name="category" aria-label="Category" value={form.category} onChange={handleChange} className="input-field__control">
                    {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="select-field">
                  <label className="input-field__label">Location</label>
                  <select name="location" aria-label="Location" value={form.location} onChange={handleChange} className="input-field__control">
                    {LOCATIONS.map((location) => <option key={location} value={location}>{location}</option>)}
                  </select>
                </div>
                <InputField label="Event date" name="eventDate" type="date" value={form.eventDate} onChange={handleChange} />
              </div>
              <InputField label="Image URL" name="imageUrl" value={form.imageUrl} onChange={handleChange} />
              <div className="input-field">
                <label className="input-field__label">Description</label>
                <textarea name="description" aria-label="Description" value={form.description} onChange={handleChange} className="input-field__control" rows={5} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button onClick={handleSave} loading={saving}>Save changes</Button>
                <Button variant="secondary" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              {item?.imageUrl && (
                <div className="item-detail__image">
                  <SafeImage src={item.imageUrl} alt={item.title} />
                </div>
              )}
              <div className="detail-grid">
                <div>
                  <span className="detail-label">Type</span>
                  <p className="detail-value">{item?.type}</p>
                </div>
                <div>
                  <span className="detail-label">Category</span>
                  <p className="detail-value">{item?.category}</p>
                </div>
                <div>
                  <span className="detail-label">Location</span>
                  <p className="detail-value">{item?.location}</p>
                </div>
                <div>
                  <span className="detail-label">Event date</span>
                  <p className="detail-value">{item?.eventDate ? formatDate(item.eventDate) : 'Not specified'}</p>
                </div>
                <div>
                  <span className="detail-label">Reported on</span>
                  <p className="detail-value">{formatDateTime(item?.createdAt)}</p>
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <span className="detail-label">Description</span>
                <p className="detail-value" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{item?.description}</p>
              </div>
            </>
          )}
        </section>

        <section className="panel">
          <div className="panel__heading">
            <div>
              <span className="panel__eyebrow">Claims</span>
              <h2>Claim information</h2>
            </div>
          </div>
          {item?.claim ? (
            <div className="claim-card">
              <div className="detail-grid">
                <div>
                  <span className="detail-label">Status</span>
                  <StatusBadge status={item.claim.status} />
                </div>
                <div>
                  <span className="detail-label">Requested</span>
                  <p className="detail-value">{formatDateTime(item.claim.requestedAt)}</p>
                </div>
              </div>
              {item.claim.message && (
                <div style={{ marginTop: '0.8rem' }}>
                  <span className="detail-label">Claim message</span>
                  <p className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{item.claim.message}</p>
                </div>
              )}
              {item.claim.reviewedAt && (
                <div style={{ marginTop: '0.8rem' }}>
                  <span className="detail-label">Reviewed</span>
                  <p className="detail-value">{formatDateTime(item.claim.reviewedAt)}</p>
                </div>
              )}
              {item.claim.reviewNote && (
                <div style={{ marginTop: '0.8rem' }}>
                  <span className="detail-label">Review note</span>
                  <p className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{item.claim.reviewNote}</p>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No claims submitted yet.</p>
          )}

          {!canClaim && !item?.claim && item?.status === 'open' && isOwner && (
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              You cannot claim your own listing.
            </p>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete listing"
        message="Are you sure you want to delete this listing? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={deleting}
      />

      <ConfirmDialog
        open={claimOpen}
        title="Submit claim"
        message="Submitting a claim requires administrator verification. Do you want to continue?"
        confirmLabel="Submit claim"
        onConfirm={handleClaim}
        onCancel={() => setClaimOpen(false)}
        loading={claiming}
      >
        <div style={{ marginTop: '0.9rem' }}>
          <InputField
            label="Message to reviewer (optional)"
            name="claimMessage"
            value={claimMessage}
            onChange={(e) => setClaimMessage(e.target.value)}
            placeholder="Explain why this item belongs to you"
          />
        </div>
      </ConfirmDialog>
    </DashboardShell>
  );
}

export default LostFoundDetails;
