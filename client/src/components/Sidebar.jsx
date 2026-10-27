import { Link, NavLink } from 'react-router-dom';

import useAuth from '../context/useAuth';

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
        <path d="M11 8v6M8 11h6" />
      </svg>
    );
  }

  if (name === 'home') {
    return (
      <svg {...commonProps}>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9M9.5 20v-6h5v6" />
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

function Sidebar() {
  const { isAdmin, user } = useAuth();
  const dashboardPath = isAdmin ? '/admin/dashboard' : '/student/dashboard';

  return (
    <aside className="sidebar" aria-label="Dashboard navigation">
      <div className="sidebar__profile">
        <span className="sidebar__eyebrow">Signed in as</span>
        <strong>{user?.name}</strong>
        <span className="sidebar__role">
          {isAdmin ? 'Administrator' : 'Student'}
        </span>
      </div>

      <nav className="sidebar__nav" aria-label="Dashboard sections">
        <span className="sidebar__section-label">Workspace</span>
        <NavLink
          className={({ isActive }) =>
            `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
          }
          to={dashboardPath}
          end
        >
          <SidebarIcon name="overview" />
          <span>Overview</span>
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
          }
          to="/complaints"
        >
          <SidebarIcon name="complaints" />
          <span>My Complaints</span>
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
          }
          to="/complaints/new"
        >
          <SidebarIcon name="overview" />
          <span>Submit Complaint</span>
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
          }
          to="/lost-found"
        >
          <SidebarIcon name="lostfound" />
          <span>Lost &amp; Found</span>
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
          }
          to="/lost-found/new"
        >
          <SidebarIcon name="overview" />
          <span>Report Lost/Found</span>
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

export default Sidebar;
