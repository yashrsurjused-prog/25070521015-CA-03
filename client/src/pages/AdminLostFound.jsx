import { useCallback, useEffect, useState } from 'react';

import AdminDashboardShell from '../components/AdminDashboardShell';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import InputField from '../components/InputField';
import SafeImage from '../components/SafeImage';
import Skeleton from '../components/Skeleton';
import StatusBadge from '../components/StatusBadge';
import SuccessMessage from '../components/SuccessMessage';
import api, { getApiErrorMessage } from '../services/api';

const CATEGORIES = ['Books', 'Electronics', 'Clothing', 'ID Cards', 'Keys', 'Bags', 'Other'];
const TYPES = ['lost', 'found'];
const STATUSES = ['open', 'claimed', 'returned', 'rejected'];
const STATUS_TRANSITIONS = {
  open: ['claimed', 'rejected'],
  claimed: ['open', 'returned', 'rejected'],
  returned: [],
  rejected: [],
};

function getAvailableStatuses(item) {
  const transitions = STATUS_TRANSITIONS[item?.status] || [];

  if (item?.status === 'open' && item?.claim?.status === 'pending') {
    return ['open', ...transitions.filter((status) => status !== 'open')];
  }

  return transitions;
}

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

function AdminLostFound() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({ search: '', type: '', category: '', status: '' });
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [moderateForm, setModerateForm] = useState({ status: '', reason: '', reviewNote: '' });
  const [updating, setUpdating] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      const params = { page, limit: 20 };
      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;

      const response = await api.get('/api/lost-found', { params });
      setItems(response.data?.items || []);
      setPagination(response.data?.pagination || { page, limit: 20, totalPages: 1 });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load lost-and-found items.'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchItems(1);
  }, [fetchItems]);

  const openDetail = async (item) => {
    setSelected(item);
    setDetailLoading(true);
    setError('');
    setModerateForm({ status: '', reason: '', reviewNote: '' });

    try {
      const response = await api.get(`/api/lost-found/${item._id}`);
      setDetail(response.data?.item);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load item details.'));
    } finally {
      setDetailLoading(false);
    }
  };

  const requestModeration = () => {
    if (!moderateForm.status) {
      setError('Select a status to update.');
      return;
    }
    if (moderateForm.status === 'rejected' && !moderateForm.reason.trim()) {
      setError('A reason is required when rejecting a listing.');
      return;
    }
    if (moderateForm.status === 'returned' && detail?.claim?.status !== 'approved') {
      setError('An approved claim is required before marking as returned.');
      return;
    }
    if (moderateForm.status === 'claimed' && detail?.claim?.status !== 'pending') {
      setError('A pending claim is required before approving a claim.');
      return;
    }
    setConfirm(moderateForm.status);
  };

  const confirmModeration = async () => {
    if (!selected || !confirm) return;
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      await api.patch(`/api/lost-found/${selected._id}/status`, {
        status: confirm,
        reason: moderateForm.reason.trim() || undefined,
        reviewNote: moderateForm.reviewNote.trim() || undefined,
      });
      setSuccess('Item status updated.');
      setConfirm(null);
      setModerateForm({ status: '', reason: '', reviewNote: '' });
      fetchItems(pagination.page);
      openDetail(selected);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update item status.'));
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    setError('');

    try {
      await api.delete(`/api/lost-found/${selected._id}`);
      setSuccess('Item deleted.');
      setDeleteOpen(false);
      setSelected(null);
      setDetail(null);
      fetchItems(pagination.page);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to delete item.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminDashboardShell
      eyebrow="Administration"
      title="Lost-and-Found Management"
      description="Review listings, manage claims, and moderate content."
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
          <InputField label="Search" name="search" value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} placeholder="Title or description" />
          <div className="select-field">
            <label className="input-field__label">Type</label>
            <select className="input-field__control" aria-label="Filter by type" value={filters.type} onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}>
              <option value="">All</option>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
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
            <label className="input-field__label">Status</label>
            <select className="input-field__control" aria-label="Filter by status" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
              <option value="">All</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </section>

      <div className="dashboard-split" style={{ marginTop: '1rem' }}>
        <section className="panel" style={{ gridColumn: selected ? '1 / 2' : '1 / -1' }}>
          <div className="panel__heading">
            <div>
              <span className="panel__eyebrow">Listings</span>
              <h2>All items</h2>
            </div>
          </div>
          {loading ? (
            <Skeleton rows={6} />
          ) : items.length === 0 ? (
            <EmptyState title="No items" message="No lost-and-found items match the current filters." />
          ) : (
            <>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Category</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Claim</th>
                      <th>Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item._id}>
                        <td>{item.title}</td>
                        <td>{item.type}</td>
                        <td>{item.category}</td>
                        <td>{item.location}</td>
                        <td><StatusBadge status={item.status} /></td>
                        <td>{item.claim?.status || 'none'}</td>
                        <td>{formatDate(item.createdAt)}</td>
                        <td className="data-table__actions">
                          <Button variant="ghost" size="sm" onClick={() => openDetail(item)}>Open</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <Button variant="secondary" size="sm" disabled={pagination.page <= 1} onClick={() => fetchItems(pagination.page - 1)}>Previous</Button>
                <span>Page {pagination.page} of {pagination.totalPages || 1}</span>
                <Button variant="secondary" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchItems(pagination.page + 1)}>Next</Button>
              </div>
            </>
          )}
        </section>

        {selected && (
          <section className="panel">
            <div className="panel__heading">
              <div>
                <span className="panel__eyebrow">Details</span>
                <h2>{selected.title}</h2>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(true)}>Delete</Button>
                <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
              </div>
            </div>
            {detailLoading ? (
              <Skeleton rows={5} />
            ) : detail ? (
              <>
                {detail.imageUrl && (
                  <div className="item-detail__image">
                    <SafeImage src={detail.imageUrl} alt={detail.title} />
                  </div>
                )}
                <div className="detail-grid">
                  <div><span className="detail-label">Type</span><p className="detail-value">{detail.type}</p></div>
                  <div><span className="detail-label">Category</span><p className="detail-value">{detail.category}</p></div>
                  <div><span className="detail-label">Location</span><p className="detail-value">{detail.location}</p></div>
                  <div><span className="detail-label">Status</span><p className="detail-value"><StatusBadge status={detail.status} /></p></div>
                </div>
                <div style={{ marginTop: '0.8rem' }}>
                  <span className="detail-label">Description</span>
                  <p className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{detail.description}</p>
                </div>

                <div className="panel" style={{ marginTop: '1rem', background: 'var(--surface-soft)' }}>
                  <h4 style={{ marginBottom: '0.6rem' }}>Claim</h4>
                  {detail.claim ? (
                    <div>
                      <div className="detail-grid">
                        <div><span className="detail-label">Status</span><p className="detail-value"><StatusBadge status={detail.claim.status} /></p></div>
                        <div><span className="detail-label">Requested</span><p className="detail-value">{formatDateTime(detail.claim.requestedAt)}</p></div>
                      </div>
                      {detail.claim.message && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <span className="detail-label">Message</span>
                          <p className="detail-value">{detail.claim.message}</p>
                        </div>
                      )}
                      {detail.claim.reviewNote && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <span className="detail-label">Review note</span>
                          <p className="detail-value">{detail.claim.reviewNote}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>No claim</p>
                  )}
                </div>

                <div className="panel" style={{ marginTop: '1rem', background: 'var(--surface-soft)' }}>
                  <h4 style={{ marginBottom: '0.6rem' }}>Moderate</h4>
                  <div className="form-row">
                    <select className="input-field__control" aria-label="New item status" value={moderateForm.status} onChange={(e) => setModerateForm((p) => ({ ...p, status: e.target.value }))} disabled={getAvailableStatuses(detail).length === 0}>
                      <option value="">{getAvailableStatuses(detail).length ? 'Select status' : 'No further status changes'}</option>
                      {getAvailableStatuses(detail).map((s) => (
                        <option key={s} value={s}>
                          {s === 'open' && detail?.status === 'open' && detail?.claim?.status === 'pending'
                            ? 'open (reject pending claim)'
                            : s}
                        </option>
                      ))}
                    </select>
                    <InputField label="Reason" name="reason" value={moderateForm.reason} onChange={(e) => setModerateForm((p) => ({ ...p, reason: e.target.value }))} placeholder="Required if rejecting" />
                  </div>
                  <InputField label="Review note" name="reviewNote" value={moderateForm.reviewNote} onChange={(e) => setModerateForm((p) => ({ ...p, reviewNote: e.target.value }))} style={{ marginTop: '0.6rem' }} />
                  <Button size="sm" style={{ marginTop: '0.6rem' }} onClick={requestModeration} loading={updating} disabled={getAvailableStatuses(detail).length === 0}>Apply moderation</Button>
                </div>
              </>
            ) : null}
          </section>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Confirm moderation"
        message={
          confirm === 'open' && detail?.status === 'open'
            ? 'Reject the pending claim? The listing will remain open for other students.'
            : `Change item status to ${confirm}?`
        }
        confirmLabel="Confirm"
        onConfirm={confirmModeration}
        onCancel={() => setConfirm(null)}
        loading={updating}
      />
      <ConfirmDialog
        open={deleteOpen}
        title="Delete listing"
        message="Are you sure you want to delete this listing?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={deleting}
      />
    </AdminDashboardShell>
  );
}

export default AdminLostFound;
