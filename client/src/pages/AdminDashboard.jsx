import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import AdminDashboardShell from '../components/AdminDashboardShell';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import Skeleton from '../components/Skeleton';
import StatusBadge from '../components/StatusBadge';
import api, { getApiErrorMessage } from '../services/api';

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

function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/analytics');
      setAnalytics(response.data?.analytics || null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load analytics.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const complaints = analytics?.complaints || {};
  const lostFound = analytics?.lostFound || {};
  const recent = analytics?.recent || {};
  const averageHours = analytics?.averageResolutionTimeHours;

  return (
    <AdminDashboardShell
      eyebrow="Administration"
      title="Admin Dashboard"
      description="Live overview of complaints, lost-and-found activity, and system statistics."
      actions={
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link to="/admin/complaints">
            <Button variant="primary">Manage Complaints</Button>
          </Link>
          <Link to="/admin/lost-found">
            <Button variant="secondary">Manage Lost &amp; Found</Button>
          </Link>
        </div>
      }
    >
      {error && <ErrorMessage title="Error" message={error} onDismiss={() => setError('')} />}

      <section className="dashboard-grid">
        {loading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <article className="dashboard-card" key={idx}>
              <Skeleton rows={3} />
            </article>
          ))
        ) : (
          <>
            <article className="dashboard-card">
              <h2>{complaints.total || 0}</h2>
              <p>Total complaints</p>
              <Link to="/admin/complaints">
                <Button variant="ghost" size="sm" style={{ marginTop: '0.8rem' }}>View all</Button>
              </Link>
            </article>
            <article className="dashboard-card">
              <h2>{complaints.pending || 0}</h2>
              <p>Pending complaints</p>
            </article>
            <article className="dashboard-card">
              <h2>{complaints.inProgress || 0}</h2>
              <p>In progress / under review</p>
            </article>
            <article className="dashboard-card">
              <h2>{complaints.resolved || 0}</h2>
              <p>Resolved complaints</p>
            </article>
            <article className="dashboard-card">
              <h2>{lostFound.total || 0}</h2>
              <p>Total lost-and-found listings</p>
              <Link to="/admin/lost-found">
                <Button variant="ghost" size="sm" style={{ marginTop: '0.8rem' }}>Manage</Button>
              </Link>
            </article>
            <article className="dashboard-card">
              <h2>{lostFound.open || 0}</h2>
              <p>Open / {lostFound.claimed || 0} claimed</p>
            </article>
          </>
        )}
      </section>

      {!loading && averageHours !== null && (
        <section className="panel" style={{ marginTop: '1rem' }}>
          <div className="panel__heading">
            <div>
              <span className="panel__eyebrow">Performance</span>
              <h2>Average resolution time</h2>
            </div>
          </div>
          <p style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--navy)' }}>{averageHours} hours</p>
          <p style={{ color: 'var(--text-muted)' }}>Calculated from resolved complaints with valid timestamps.</p>
        </section>
      )}

      <div className="dashboard-split" style={{ marginTop: '1rem' }}>
        <section className="panel">
          <div className="panel__heading">
            <div>
              <span className="panel__eyebrow">Complaints</span>
              <h2>By status &amp; category</h2>
            </div>
          </div>
          {loading ? (
            <Skeleton rows={4} />
          ) : (
            <div className="two-column">
              <div>
                <h4 style={{ marginBottom: '0.6rem' }}>By status</h4>
                {(complaints.byStatus || []).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No data</p>
                ) : (
                  <ul className="stat-list">
                    {complaints.byStatus.map((item) => (
                      <li key={item._id}>
                        <span>{item._id?.replace('_', ' ')}</span>
                        <strong>{item.count}</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h4 style={{ marginBottom: '0.6rem' }}>By category</h4>
                {(complaints.byCategory || []).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No data</p>
                ) : (
                  <ul className="stat-list">
                    {complaints.byCategory.map((item) => (
                      <li key={item._id}>
                        <span>{item._id}</span>
                        <strong>{item.count}</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel__heading">
            <div>
              <span className="panel__eyebrow">Lost &amp; Found</span>
              <h2>By status &amp; type</h2>
            </div>
          </div>
          {loading ? (
            <Skeleton rows={4} />
          ) : (
            <div className="two-column">
              <div>
                <h4 style={{ marginBottom: '0.6rem' }}>By status</h4>
                {(lostFound.byStatus || []).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No data</p>
                ) : (
                  <ul className="stat-list">
                    {lostFound.byStatus.map((item) => (
                      <li key={item._id}>
                        <span>{item._id}</span>
                        <strong>{item.count}</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h4 style={{ marginBottom: '0.6rem' }}>By type</h4>
                {(lostFound.byType || []).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No data</p>
                ) : (
                  <ul className="stat-list">
                    {lostFound.byType.map((item) => (
                      <li key={item._id}>
                        <span>{item._id}</span>
                        <strong>{item.count}</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="dashboard-split" style={{ marginTop: '1rem' }}>
        <section className="panel">
          <div className="panel__heading">
            <div>
              <span className="panel__eyebrow">Recent complaints</span>
              <h2>Latest submissions</h2>
            </div>
            <Link to="/admin/complaints">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </div>
          {loading ? (
            <Skeleton rows={4} />
          ) : (recent.complaints || []).length === 0 ? (
            <EmptyState title="No complaints" message="No complaints in the database." />
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Reporter</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.complaints.map((complaint) => (
                    <tr key={complaint._id}>
                      <td className="data-table__mono">{complaint.ticketId}</td>
                      <td>{complaint.title}</td>
                      <td><StatusBadge status={getStatusTone(complaint.status)} /></td>
                      <td>{complaint.createdBy?.name || 'N/A'}</td>
                      <td>{formatDate(complaint.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel__heading">
            <div>
              <span className="panel__eyebrow">Recent lost &amp; found</span>
              <h2>Latest listings</h2>
            </div>
            <Link to="/admin/lost-found">
              <Button variant="ghost" size="sm">Manage</Button>
            </Link>
          </div>
          {loading ? (
            <Skeleton rows={4} />
          ) : (recent.lostFound || []).length === 0 ? (
            <EmptyState title="No listings" message="No lost-and-found items in the database." />
          ) : (
            <div className="list-stack">
              {recent.lostFound.map((item) => (
                <Link key={item._id} to={`/admin/lost-found`} className="list-item">
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.type} • {item.category} • {item.location}</span>
                  </div>
                  <StatusBadge status={item.status} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminDashboardShell>
  );
}

export default AdminDashboard;
