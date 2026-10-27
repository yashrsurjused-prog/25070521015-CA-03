import { useCallback, useEffect, useState } from 'react';

import AdminDashboardShell from '../components/AdminDashboardShell';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import InputField from '../components/InputField';
import Skeleton from '../components/Skeleton';
import StatusBadge from '../components/StatusBadge';
import SuccessMessage from '../components/SuccessMessage';
import api, { getApiErrorMessage } from '../services/api';

const CATEGORIES = ['Maintenance', 'Cleanliness', 'Safety', 'Internet', 'Water', 'Other'];
const STATUSES = ['pending', 'under_review', 'in_progress', 'resolved', 'rejected'];
const STATUS_TRANSITIONS = {
  pending: ['under_review', 'in_progress', 'rejected'],
  under_review: ['in_progress', 'rejected'],
  in_progress: ['resolved', 'rejected'],
  resolved: [],
  rejected: [],
};
const PRIORITIES = ['low', 'medium', 'high'];

function formatDate(value) {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleDateString();
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

function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({ search: '', status: '', category: '', priority: '' });
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionForm, setActionForm] = useState({ priority: '', status: '', remarks: '' });
  const [updating, setUpdating] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState(null);

  const fetchComplaints = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      const params = { page, limit: 20 };
      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.priority) params.priority = filters.priority;

      const response = await api.get('/api/complaints', { params });
      setComplaints(response.data?.complaints || []);
      setPagination(response.data?.pagination || { page, limit: 20, totalPages: 1 });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load complaints.'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchComplaints(1);
  }, [fetchComplaints]);

  const openDetail = async (complaint) => {
    setSelected(complaint);
    setDetailLoading(true);
    setError('');
    setActionForm({ priority: complaint.priority || '', status: '', remarks: '' });

    try {
      const response = await api.get(`/api/complaints/${complaint._id}`);
      setDetail(response.data?.complaint);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load complaint details.'));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleActionChange = (event) => {
    const { name, value } = event.target;
    setActionForm((prev) => ({ ...prev, [name]: value }));
  };

  const applyPriority = async () => {
    if (!selected || !actionForm.priority) return;
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      await api.patch(`/api/complaints/${selected._id}`, { priority: actionForm.priority });
      setSuccess('Priority updated.');
      fetchComplaints(pagination.page);
      openDetail(selected);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update priority.'));
    } finally {
      setUpdating(false);
    }
  };

  const requestStatusChange = () => {
    if (!actionForm.status) {
      setError('Select a status to update.');
      return;
    }
    if (actionForm.status === 'rejected' && !actionForm.remarks.trim()) {
      setError('A reason is required when rejecting a complaint.');
      return;
    }
    setConfirmStatus(actionForm.status);
  };

  const confirmStatusChange = async () => {
    if (!selected || !confirmStatus) return;
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      await api.patch(`/api/complaints/${selected._id}/status`, {
        status: confirmStatus,
        remarks: actionForm.remarks.trim() || undefined,
      });
      setSuccess('Status updated.');
      setConfirmStatus(null);
      setActionForm((prev) => ({ ...prev, status: '', remarks: '' }));
      fetchComplaints(pagination.page);
      openDetail(selected);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update status.'));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <AdminDashboardShell
      eyebrow="Administration"
      title="Complaint Management"
      description="Review all complaints, update priority/status, and track history."
    >
      {error && <ErrorMessage title="Error" message={error} onDismiss={() => setError('')} />}
      {success && <SuccessMessage title="Success" message={success} onDismiss={() => setSuccess('')} />}

      <section className="panel">
        <div className="panel__heading">
          <div>
            <span className="panel__eyebrow">Filters</span>
            <h2>Search and filter</h2>
          </div>
        </div>
        <div className="filter-grid">
          <InputField label="Search" name="search" value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} placeholder="Ticket, title, description..." />
          <div className="select-field">
            <label className="input-field__label">Status</label>
            <select className="input-field__control" aria-label="Filter by status" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
              <option value="">All</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="select-field">
            <label className="input-field__label">Category</label>
            <select className="input-field__control" aria-label="Filter by category" value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}>
              <option value="">All</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="select-field">
            <label className="input-field__label">Priority</label>
            <select className="input-field__control" aria-label="Filter by priority" value={filters.priority} onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value }))}>
              <option value="">All</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </section>

      <div className="dashboard-split" style={{ marginTop: '1rem' }}>
        <section className="panel" style={{ gridColumn: selected ? '1 / 2' : '1 / -1' }}>
          <div className="panel__heading">
            <div>
              <span className="panel__eyebrow">Complaints</span>
              <h2>All complaints</h2>
            </div>
          </div>
          {loading ? (
            <Skeleton rows={6} />
          ) : complaints.length === 0 ? (
            <EmptyState title="No complaints" message="No complaints match the current filters." />
          ) : (
            <>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ticket</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Location</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Reporter</th>
                      <th>Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((complaint) => (
                      <tr key={complaint._id}>
                        <td className="data-table__mono">{complaint.ticketId}</td>
                        <td>{complaint.title}</td>
                        <td>{complaint.category}</td>
                        <td>{complaint.location}</td>
                        <td><StatusBadge status={complaint.priority} /></td>
                        <td><StatusBadge status={getStatusTone(complaint.status)} /></td>
                        <td>{complaint.createdBy?.name || 'N/A'}</td>
                        <td>{formatDate(complaint.createdAt)}</td>
                        <td className="data-table__actions">
                          <Button variant="ghost" size="sm" onClick={() => openDetail(complaint)}>Open</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <Button variant="secondary" size="sm" disabled={pagination.page <= 1} onClick={() => fetchComplaints(pagination.page - 1)}>Previous</Button>
                <span>Page {pagination.page} of {pagination.totalPages || 1}</span>
                <Button variant="secondary" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchComplaints(pagination.page + 1)}>Next</Button>
              </div>
            </>
          )}
        </section>

        {selected && (
          <section className="panel">
            <div className="panel__heading">
              <div>
                <span className="panel__eyebrow">Details</span>
                <h2>{selected.ticketId}</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
            </div>
            {detailLoading ? (
              <Skeleton rows={5} />
            ) : detail ? (
              <>
                <div className="detail-grid">
                  <div><span className="detail-label">Title</span><p className="detail-value">{detail.title}</p></div>
                  <div><span className="detail-label">Category</span><p className="detail-value">{detail.category}</p></div>
                  <div><span className="detail-label">Location</span><p className="detail-value">{detail.location}</p></div>
                  <div><span className="detail-label">Reporter</span><p className="detail-value">{detail.createdBy?.name} ({detail.createdBy?.email})</p></div>
                </div>
                <div style={{ marginTop: '0.8rem' }}>
                  <span className="detail-label">Description</span>
                  <p className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{detail.description}</p>
                </div>

                <div className="panel" style={{ marginTop: '1rem', background: 'var(--surface-soft)' }}>
                  <h4 style={{ marginBottom: '0.6rem' }}>Update priority</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <select className="input-field__control" aria-label="Complaint priority" style={{ maxWidth: '200px' }} value={actionForm.priority} onChange={handleActionChange} name="priority">
                      <option value="">Select priority</option>
                      {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <Button size="sm" onClick={applyPriority} loading={updating}>Apply</Button>
                  </div>
                </div>

                <div className="panel" style={{ marginTop: '1rem', background: 'var(--surface-soft)' }}>
                  <h4 style={{ marginBottom: '0.6rem' }}>Change status</h4>
                  <div className="form-row">
                    <select className="input-field__control" aria-label="New complaint status" value={actionForm.status} onChange={handleActionChange} name="status" disabled={!STATUS_TRANSITIONS[detail.status]?.length}>
                      <option value="">{STATUS_TRANSITIONS[detail.status]?.length ? 'Select status' : 'No further status changes'}</option>
                      {(STATUS_TRANSITIONS[detail.status] || []).map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                    <InputField label="Remarks" name="remarks" value={actionForm.remarks} onChange={handleActionChange} placeholder={actionForm.status === 'rejected' ? 'Reason required' : 'Optional'} />
                  </div>
                  <Button size="sm" style={{ marginTop: '0.6rem' }} onClick={requestStatusChange} loading={updating} disabled={!STATUS_TRANSITIONS[detail.status]?.length}>Update status</Button>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ marginBottom: '0.6rem' }}>Status history</h4>
                  {(detail.history || []).length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No history</p>
                  ) : (
                    <div className="timeline">
                      {detail.history.slice().reverse().map((entry, idx) => (
                        <div className="timeline-item" key={idx}>
                          <div className="timeline-dot" />
                          <div className="timeline-content">
                            <strong>{entry.status.replace('_', ' ')}</strong>
                            <div style={{ color: 'var(--text-subtle)', fontSize: '0.8rem' }}>{formatDate(entry.changedAt)}</div>
                            {entry.remark && <p style={{ marginTop: '0.3rem' }}>{entry.remark}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </section>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirmStatus)}
        title="Confirm status change"
        message={confirmStatus === 'rejected' ? 'Reject this complaint? A reason is required.' : `Change status to ${confirmStatus?.replace('_', ' ')}?`}
        confirmLabel="Confirm"
        onConfirm={confirmStatusChange}
        onCancel={() => setConfirmStatus(null)}
        loading={updating}
      />
    </AdminDashboardShell>
  );
}

export default AdminComplaints;
