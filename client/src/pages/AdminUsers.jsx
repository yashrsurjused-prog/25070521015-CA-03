import { useCallback, useEffect, useState } from 'react';

import AdminDashboardShell from '../components/AdminDashboardShell';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import InputField from '../components/InputField';
import Skeleton from '../components/Skeleton';
import api, { getApiErrorMessage } from '../services/api';

function formatDate(value) {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', role: '' });

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      const params = { page, limit: 20 };
      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.role) params.role = filters.role;

      const response = await api.get('/api/admin/users', { params });
      setUsers(response.data?.users || []);
      setPagination(response.data?.pagination || { page, limit: 20, totalPages: 1 });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load users.'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  return (
    <AdminDashboardShell
      eyebrow="Administration"
      title="User Directory"
      description="View all users with search and filtering."
    >
      {error && <ErrorMessage title="Error" message={error} onDismiss={() => setError('')} />}

      <section className="panel">
        <div className="panel__heading">
          <div>
            <span className="panel__eyebrow">Filters</span>
            <h2>Search and filter</h2>
          </div>
        </div>
        <div className="filter-grid">
          <InputField label="Search" name="search" value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} placeholder="Name, email, student ID, department" />
          <div className="select-field">
            <label className="input-field__label">Role</label>
            <select className="input-field__control" aria-label="Filter by role" value={filters.role} onChange={(e) => setFilters((p) => ({ ...p, role: e.target.value }))}>
              <option value="">All</option>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </section>

      <section className="panel" style={{ marginTop: '1rem' }}>
        <div className="panel__heading">
          <div>
            <span className="panel__eyebrow">Users</span>
            <h2>All accounts</h2>
          </div>
        </div>
        {loading ? (
          <Skeleton rows={6} />
        ) : users.length === 0 ? (
          <EmptyState title="No users" message="No users match the current filters." />
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Student ID</th>
                    <th>Department</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{user.studentId || 'N/A'}</td>
                      <td>{user.department || 'N/A'}</td>
                      <td>{formatDate(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <Button variant="secondary" size="sm" disabled={pagination.page <= 1} onClick={() => fetchUsers(pagination.page - 1)}>Previous</Button>
              <span>Page {pagination.page} of {pagination.totalPages || 1}</span>
              <Button variant="secondary" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchUsers(pagination.page + 1)}>Next</Button>
            </div>
          </>
        )}
      </section>
    </AdminDashboardShell>
  );
}

export default AdminUsers;
