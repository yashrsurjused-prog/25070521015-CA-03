import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Button from '../components/Button';
import DashboardShell from '../components/DashboardShell';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import Skeleton from '../components/Skeleton';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/useAuth';
import api, { getApiErrorMessage } from '../services/api';

function formatDate(value) {
  if (!value) {
    return 'N/A';
  }

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

function StudentDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [lostItems, setLostItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      const [complaintRes, lostRes] = await Promise.all([
        api.get('/api/complaints', { params: { page: 1, limit: 10 } }),
        api.get('/api/lost-found', { params: { page: 1, limit: 6 } }),
      ]);

      setComplaints(complaintRes.data?.complaints || []);
      setLostItems(lostRes.data?.items || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load dashboard data.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === 'pending').length;
  const inProgress = complaints.filter(
    (c) => c.status === 'under_review' || c.status === 'in_progress',
  ).length;
  const resolved = complaints.filter((c) => c.status === 'resolved').length;
  const recentComplaints = [...complaints]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <DashboardShell
      eyebrow="Student workspace"
      title={`Welcome, ${user?.name?.split(' ')[0] || 'student'}`}
      description="Track your complaints and manage lost-and-found reports from one place."
      actions={
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link to="/complaints/new">
            <Button variant="primary">Submit Complaint</Button>
          </Link>
          <Link to="/lost-found/new">
            <Button variant="secondary">Report Lost/Found</Button>
          </Link>
        </div>
      }
    >
      {error && (
        <ErrorMessage
          title="Unable to load dashboard"
          message={error}
          onDismiss={() => setError('')}
        />
      )}

      <section className="dashboard-grid" aria-label="Complaint statistics">
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <article className="dashboard-card" key={idx}>
              <Skeleton rows={3} />
            </article>
          ))
        ) : (
          <>
            <article className="dashboard-card">
              <span className="dashboard-card__icon">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2h9A2.5 2.5 0 0 1 19 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 19.5z" />
                  <path d="M8.5 7.5h7M8.5 11.5h7M8.5 15.5h4" />
                </svg>
              </span>
              <h2>{total}</h2>
              <p>Total complaints submitted</p>
            </article>
            <article className="dashboard-card">
              <span className="dashboard-card__icon">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4l2 2" />
                </svg>
              </span>
              <h2>{pending}</h2>
              <p>Pending complaints</p>
            </article>
            <article className="dashboard-card">
              <span className="dashboard-card__icon">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </span>
              <h2>{inProgress}</h2>
              <p>In progress / under review</p>
            </article>
            <article className="dashboard-card">
              <span className="dashboard-card__icon">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 12 4 4 10-10" />
                </svg>
              </span>
              <h2>{resolved}</h2>
              <p>Resolved complaints</p>
            </article>
          </>
        )}
      </section>

      <div className="dashboard-split">
        <section className="panel">
          <div className="panel__heading">
            <div>
              <span className="panel__eyebrow">Recent complaints</span>
              <h2>Your latest submissions</h2>
            </div>
            <Link to="/complaints">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </div>

          {loading ? (
            <Skeleton rows={5} />
          ) : recentComplaints.length === 0 ? (
            <EmptyState
              title="No complaints yet"
              message="Submit your first complaint to track campus issues."
              action={
                <Link to="/complaints/new">
                  <Button variant="primary">Submit Complaint</Button>
                </Link>
              }
            />
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentComplaints.map((complaint) => (
                    <tr key={complaint._id}>
                      <td className="data-table__mono">{complaint.ticketId}</td>
                      <td>{complaint.title}</td>
                      <td>
                        <StatusBadge status={getStatusTone(complaint.status)} />
                      </td>
                      <td>{formatDate(complaint.createdAt)}</td>
                      <td className="data-table__actions">
                        <Link to={`/complaints/${complaint._id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
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
              <span className="panel__eyebrow">Lost &amp; found</span>
              <h2>Recent listings</h2>
            </div>
            <Link to="/lost-found">
              <Button variant="ghost" size="sm">
                Browse all
              </Button>
            </Link>
          </div>

          {loading ? (
            <Skeleton rows={4} />
          ) : lostItems.length === 0 ? (
            <EmptyState
              title="No listings yet"
              message="Browse lost-and-found items or report one."
              action={
                <Link to="/lost-found/new">
                  <Button variant="primary">Report item</Button>
                </Link>
              }
            />
          ) : (
            <div className="list-stack">
              {lostItems.slice(0, 4).map((item) => (
                <Link
                  key={item._id}
                  to={`/lost-found/${item._id}`}
                  className="list-item"
                >
                  <div>
                    <strong>{item.title}</strong>
                    <span>
                      {item.type} • {item.category} • {item.location}
                    </span>
                  </div>
                  <StatusBadge status={item.status} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="dashboard-split">
        <section className="panel panel--accent">
          <div className="panel__heading">
            <div>
              <span className="panel__eyebrow">Quick actions</span>
              <h2>Get started</h2>
            </div>
          </div>
          <div className="quick-actions">
            <Link to="/complaints/new" className="quick-action">
              <div>
                <strong>Submit a complaint</strong>
                <span>Report maintenance, safety, or facility issues</span>
              </div>
              <span>→</span>
            </Link>
            <Link to="/complaints" className="quick-action">
              <div>
                <strong>View my complaints</strong>
                <span>Track status and update pending complaints</span>
              </div>
              <span>→</span>
            </Link>
            <Link to="/lost-found/new" className="quick-action">
              <div>
                <strong>Report lost or found</strong>
                <span>Post items and help recover belongings</span>
              </div>
              <span>→</span>
            </Link>
            <Link to="/lost-found" className="quick-action">
              <div>
                <strong>Browse lost &amp; found</strong>
                <span>Search and claim eligible items</span>
              </div>
              <span>→</span>
            </Link>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

export default StudentDashboard;
