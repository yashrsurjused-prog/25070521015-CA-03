import { Link, NavLink } from 'react-router-dom';

import { useAuth } from '../context/useAuth';

function SidebarIcon({ name }) {
  const commonProps = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  if (name === 'complaints') {
    return (
      <svg {...commonProps}>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5z" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    );
  }

  if (name === 'lostfound') {
    return (
      <svg {...commonProps}>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </svg>
    );
  }

  if (name === 'users') {
    return (
      <svg {...commonProps}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      </svg>
    );
  }

  if (name === 'home') {
    return (
      <svg {...commonProps}>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function AdminSidebar() {
  const { user } = useAuth();

  return (
    <aside className="sidebar" aria-label="Admin navigation">
      <div className="sidebar__profile">
        <span className="sidebar__eyebrow">Signed in as</span>
        <strong>{user?.name}</strong>
        <span className="sidebar__role">Administrator</span>
      </div>

      <nav className="sidebar__nav" aria-label="Admin sections">
        <span className="sidebar__section-label">Administration</span>
        <NavLink
          className={({ isActive }) =>
            `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
          }
          to="/admin/dashboard"
          end
        >
          <SidebarIcon name="overview" />
          <span>Overview</span>
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
          }
          to="/admin/complaints"
        >
          <SidebarIcon name="complaints" />
          <span>Complaint Management</span>
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
          }
          to="/admin/lost-found"
        >
          <SidebarIcon name="lostfound" />
          <span>Lost-and-Found Management</span>
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
          }
          to="/admin/users"
        >
          <SidebarIcon name="users" />
          <span>User Directory</span>
        </NavLink>
      </nav>

      <div className="sidebar__footer">
        <Link className="sidebar__home-link" to="/">
          <SidebarIcon name="home" />
          <span>Public homepage</span>
        </Link>
      </div>
    </aside>
  );
}

export default AdminSidebar;
