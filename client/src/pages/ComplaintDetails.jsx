import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import DashboardShell from '../components/DashboardShell';
import ErrorMessage from '../components/ErrorMessage';
import InputField from '../components/InputField';
import PageLoader from '../components/PageLoader';
import StatusBadge from '../components/StatusBadge';
import SuccessMessage from '../components/SuccessMessage';
import api, { getApiErrorMessage } from '../services/api';

const CATEGORIES = ['Maintenance', 'Cleanliness', 'Safety', 'Internet', 'Water', 'Other'];

function formatDateTime(value) {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function getStatusTone(status) {
  if (status === 'resolved') return 'resolved';
  if (status === 'in_progress' || status === 'under_review') return status;
  if (status === 'rejected') return 'rejected';
  return 'pending';
}

function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: '', location: '' });
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchComplaint = useCallback(async () => {
    try {
      const response = await api.get(`/api/complaints/${id}`);
      const data = response.data?.complaint;
      setComplaint(data);
      setForm({
        title: data?.title || '',
        description: data?.description || '',
        category: data?.category || '',
        location: data?.location || '',
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load complaint details.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchComplaint();
  }, [fetchComplaint]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.patch(`/api/complaints/${id}`, {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        location: form.location.trim(),
      });
      setComplaint(response.data?.complaint);
      setEditing(false);
      setSuccess('Complaint updated successfully.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update complaint.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError('');

    try {
      await api.delete(`/api/complaints/${id}`);
      navigate('/complaints');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to delete complaint.'));
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell eyebrow="Complaints" title="Complaint Details">
        <PageLoader label="Loading complaint details..." />
      </DashboardShell>
    );
  }

  if (error && !complaint) {
    return (
      <DashboardShell eyebrow="Complaints" title="Complaint Details">
        <ErrorMessage title="Error" message={error} />
        <div style={{ marginTop: '1rem' }}>
          <Link to="/complaints">
            <Button variant="secondary">Back to My Complaints</Button>
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const canEditDelete = complaint?.status === 'pending';

  return (
    <DashboardShell
      eyebrow="Complaints"
      title={`Complaint ${complaint?.ticketId}`}
      description="View full details, status history, and manage your complaint."
      actions={
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link to="/complaints">
            <Button variant="secondary">Back to list</Button>
          </Link>
          {canEditDelete && !editing && (
            <Button variant="secondary" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
          {canEditDelete && !editing && (
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
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
              <span className="panel__eyebrow">Details</span>
              <h2>Complaint information</h2>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <StatusBadge status={complaint?.priority} />
              <StatusBadge status={getStatusTone(complaint?.status)} />
            </div>
          </div>

          {editing ? (
            <div className="auth-form">
              <InputField label="Title" name="title" value={form.title} onChange={handleChange} />
              <div className="input-field">
                <label className="input-field__label">Description</label>
                <textarea
                  name="description"
                  aria-label="Description"
                  value={form.description}
                  onChange={handleChange}
                  className="input-field__control"
                  rows={5}
                />
              </div>
              <div className="form-row">
                <div className="select-field">
                  <label className="input-field__label">Category</label>
                  <select name="category" aria-label="Category" value={form.category} onChange={handleChange} className="input-field__control">
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <InputField label="Location" name="location" value={form.location} onChange={handleChange} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button onClick={handleSave} loading={saving}>Save changes</Button>
                <Button variant="secondary" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="detail-grid">
                <div>
                  <span className="detail-label">Ticket ID</span>
                  <p className="detail-value detail-value--mono">{complaint?.ticketId}</p>
                </div>
                <div>
                  <span className="detail-label">Category</span>
                  <p className="detail-value">{complaint?.category}</p>
                </div>
                <div>
                  <span className="detail-label">Location</span>
                  <p className="detail-value">{complaint?.location}</p>
                </div>
                <div>
                  <span className="detail-label">Submitted</span>
                  <p className="detail-value">{formatDateTime(complaint?.createdAt)}</p>
                </div>
                <div>
                  <span className="detail-label">Last updated</span>
                  <p className="detail-value">{formatDateTime(complaint?.updatedAt)}</p>
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <span className="detail-label">Title</span>
                <p className="detail-value" style={{ fontSize: '1rem', fontWeight: 600 }}>{complaint?.title}</p>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <span className="detail-label">Description</span>
                <p className="detail-value" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{complaint?.description}</p>
              </div>
            </>
          )}
        </section>

        <section className="panel">
          <div className="panel__heading">
            <div>
              <span className="panel__eyebrow">Status history</span>
              <h2>Timeline</h2>
            </div>
          </div>
          {complaint?.history && complaint.history.length > 0 ? (
            <div className="timeline">
              {complaint.history.slice().reverse().map((entry, index) => (
                <div className="timeline-item" key={index}>
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <strong>Status: {entry.status.replace('_', ' ')}</strong>
                      <span style={{ color: 'var(--text-subtle)', fontSize: '0.8rem' }}>{formatDateTime(entry.changedAt)}</span>
                    </div>
                    {entry.remark && <p style={{ marginTop: '0.3rem', color: 'var(--text-muted)' }}>{entry.remark}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No status history available.</p>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete complaint"
        message="Are you sure you want to delete this complaint? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={deleting}
      />
    </DashboardShell>
  );
}

export default ComplaintDetails;
