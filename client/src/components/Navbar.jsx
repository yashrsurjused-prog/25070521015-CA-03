import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import useAuth from '../context/useAuth';

function getInitials(name) {
  if (!name) {
    return 'SC';
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const dashboardPath = isAdmin ? '/admin/dashboard' : '/student/dashboard';
  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    closeMenu();
    logout();
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="navbar">
        <Link
          className="brand"
          to="/"
          aria-label="Smart Campus home"
          onClick={closeMenu}
        >
          <span className="brand__mark" aria-hidden="true">
            SC
          </span>
          <span className="brand__text">
            <strong>Smart Campus</strong>
            <span>Service Portal</span>
          </span>
        </Link>

        <button
          className={`navbar__toggle${menuOpen ? ' navbar__toggle--open' : ''}`}
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          className={`navbar__nav${menuOpen ? ' navbar__nav--open' : ''}`}
          aria-label="Main navigation"
        >
          <div className="navbar__links">
            <NavLink className="navbar__link" to="/" end onClick={closeMenu}>
              Home
            </NavLink>
            <Link className="navbar__link" to="/#services" onClick={closeMenu}>
              Services
            </Link>
            <Link
              className="navbar__link"
              to="/#how-it-works"
              onClick={closeMenu}
            >
              How it works
            </Link>
            {isAuthenticated && (
              <>
                <NavLink
                  className="navbar__link"
                  to={dashboardPath}
                  onClick={closeMenu}
                >
                  Dashboard
                </NavLink>
                {!isAdmin && (
                  <>
                    <NavLink
                      className="navbar__link"
                      to="/complaints"
                      onClick={closeMenu}
                    >
                      My Complaints
                    </NavLink>
                    <NavLink
                      className="navbar__link"
                      to="/lost-found"
                      onClick={closeMenu}
                    >
                      Lost &amp; Found
                    </NavLink>
                  </>
                )}
              </>
            )}
          </div>

          <div className="navbar__actions">
            {isAuthenticated ? (
              <>
                <div className="navbar__user">
                  <span className="navbar__avatar" aria-hidden="true">
                    {getInitials(user?.name)}
                  </span>
                  <span className="navbar__user-copy">
                    <strong>{user?.name}</strong>
                    <span>{isAdmin ? 'Administrator' : 'Student'}</span>
                  </span>
                </div>
                <button
                  className="navbar__logout"
                  type="button"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  className="button button--ghost button--sm"
                  to="/login"
                  onClick={closeMenu}
                >
                  Log in
                </Link>
                <Link
                  className="button button--primary button--sm"
                  to="/register"
                  onClick={closeMenu}
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
