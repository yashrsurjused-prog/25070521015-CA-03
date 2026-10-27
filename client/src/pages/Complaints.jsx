import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import DashboardShell from '../components/DashboardShell';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import InputField from '../components/InputField';
import Skeleton from '../components/Skeleton';
import StatusBadge from '../components/StatusBadge';
import SuccessMessage from '../components/SuccessMessage';
import api, { getApiErrorMessage } from '../services/api';

const CATEGORIES = ['Maintenance', 'Cleanliness', 'Safety', 'Internet', 'Water', 'Other'];
const STATUSES = ['pending', 'under_review', 'in_progress', 'resolved', 'rejected'];
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

function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
    priority: '',
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchComplaints = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      const params = { page, limit: 10 };
      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.priority) params.priority = filters.priority;

      const response = await api.get('/api/complaints', { params });
      setComplaints(response.data?.complaints || []);
      setPagination(response.data?.pagination || { page, limit: 10, totalPages: 1 });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load complaints.'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchComplaints(1);
  }, [fetchComplaints]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      await api.delete(`/api/complaints/${deleteTarget._id}`);
      setSuccess('Complaint deleted successfully.');
      setDeleteTarget(null);
      fetchComplaints(pagination.page);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to delete complaint.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardShell
      eyebrow="Complaints"
      title="My Complaints"
      description="View, search, filter, edit, or delete your complaints."
      actions={
        <Link to="/complaints/new">
          <Button variant="primary">Submit Complaint</Button>
        </Link>
      }
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
          <InputField
            label="Search"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search by ticket, title, category..."
          />
          <div className="select-field">
            <label className="input-field__label">Status</label>
            <select name="status" aria-label="Filter by status" value={filters.status} onChange={handleFilterChange} className="input-field__control">
              <option value="">All</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>{status.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div className="select-field">
            <label className="input-field__label">Category</label>
            <select name="category" aria-label="Filter by category" value={filters.category} onChange={handleFilterChange} className="input-field__control">
              <option value="">All</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="select-field">
            <label className="input-field__label">Priority</label>
            <select name="priority" aria-label="Filter by priority" value={filters.priority} onChange={handleFilterChange} className="input-field__control">
              <option value="">All</option>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="panel" style={{ marginTop: '1rem' }}>
        <div className="panel__heading">
          <div>
            <span className="panel__eyebrow">Complaints list</span>
            <h2>All submissions</h2>
          </div>
        </div>

        {loading ? (
          <Skeleton rows={6} />
        ) : complaints.length === 0 ? (
          <EmptyState
            title="No complaints found"
            message="Try adjusting filters or submit a new complaint."
            action={
              <Link to="/complaints/new">
                <Button variant="primary">Submit Complaint</Button>
              </Link>
            }
          />
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Actions</th>
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
                      <td>{formatDate(complaint.createdAt)}</td>
                      <td className="data-table__actions">
                        <Link to={`/complaints/${complaint._id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                        {complaint.status === 'pending' && (
                          <>
                            <Link to={`/complaints/${complaint._id}/edit`}>
                              <Button variant="ghost" size="sm">Edit</Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(complaint)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchComplaints(pagination.page - 1)}
              >
                Previous
              </Button>
              <span>Page {pagination.page} of {pagination.totalPages || 1}</span>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchComplaints(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete complaint"
        message={`Are you sure you want to delete ${deleteTarget?.ticketId}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </DashboardShell>
  );
}

export default Complaints;
