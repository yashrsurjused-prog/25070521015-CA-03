import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Button from '../components/Button';
import DashboardShell from '../components/DashboardShell';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import InputField from '../components/InputField';
import SafeImage from '../components/SafeImage';
import Skeleton from '../components/Skeleton';
import StatusBadge from '../components/StatusBadge';
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

function LostFound() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    category: '',
    location: '',
    dateFrom: '',
    dateTo: '',
  });

  const fetchItems = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      const params = { page, limit: 12 };
      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;
      if (filters.location) params.location = filters.location;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;

      const response = await api.get('/api/lost-found', { params });
      setItems(response.data?.items || []);
      setPagination(response.data?.pagination || { page, limit: 12, totalPages: 1 });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load lost-and-found items.'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchItems(1);
  }, [fetchItems]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <DashboardShell
      eyebrow="Lost & Found"
      title="Browse Items"
      description="Search for lost or found items across campus."
      actions={
        <Link to="/lost-found/new">
          <Button variant="primary">Report Lost/Found Item</Button>
        </Link>
      }
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
          <InputField
            label="Search"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search by title or description"
          />
          <div className="select-field">
            <label className="input-field__label">Type</label>
            <select name="type" aria-label="Filter by type" value={filters.type} onChange={handleFilterChange} className="input-field__control">
              <option value="">All</option>
              {TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
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
            <label className="input-field__label">Location</label>
            <select name="location" aria-label="Filter by location" value={filters.location} onChange={handleFilterChange} className="input-field__control">
              <option value="">All</option>
              {LOCATIONS.map((location) => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
          <InputField
            label="From date"
            name="dateFrom"
            type="date"
            value={filters.dateFrom}
            onChange={handleFilterChange}
          />
          <InputField
            label="To date"
            name="dateTo"
            type="date"
            value={filters.dateTo}
            onChange={handleFilterChange}
          />
        </div>
      </section>

      <section style={{ marginTop: '1rem' }}>
        {loading ? (
          <div className="card-grid">
            {Array.from({ length: 6 }).map((_, idx) => (
              <article className="item-card" key={idx}>
                <Skeleton rows={4} />
              </article>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No items found"
            message="Try adjusting filters or report a lost or found item."
            action={
              <Link to="/lost-found/new">
                <Button variant="primary">Report item</Button>
              </Link>
            }
          />
        ) : (
          <>
            <div className="card-grid">
              {items.map((item) => (
                <article className="item-card" key={item._id}>
                  {item.imageUrl ? (
                    <div className="item-card__image">
                      <SafeImage src={item.imageUrl} alt={item.title} />
                    </div>
                  ) : (
                    <div className="item-card__image item-card__image--placeholder">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="m21 15-5-5L5 21" />
                      </svg>
                    </div>
                  )}
                  <div className="item-card__body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <h3>{item.title}</h3>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="item-card__meta">
                      {item.type} • {item.category} • {item.location}
                    </p>
                    <p className="item-card__date">{item.eventDate ? formatDate(item.eventDate) : `Reported ${formatDate(item.createdAt)}`}</p>
                    <Link to={`/lost-found/${item._id}`}>
                      <Button variant="secondary" size="sm" style={{ marginTop: '0.5rem' }}>
                        View details
                      </Button>
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div className="pagination" style={{ marginTop: '1.5rem' }}>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchItems(pagination.page - 1)}
              >
                Previous
              </Button>
              <span>Page {pagination.page} of {pagination.totalPages || 1}</span>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchItems(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </section>
    </DashboardShell>
  );
}

export default LostFound;
