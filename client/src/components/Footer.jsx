import { Link } from 'react-router-dom';

import useAuth from '../context/useAuth';

const CURRENT_YEAR = new Date().getFullYear();

function Footer() {
  const { isAuthenticated, isAdmin } = useAuth();
  const dashboardPath = isAdmin ? '/admin/dashboard' : '/student/dashboard';

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <span className="brand__mark brand__mark--small" aria-hidden="true">
            SC
          </span>
          <div>
            <strong>Smart Campus Service Portal</strong>
            <p>Clearer campus services for students and administrators.</p>
          </div>
        </div>

        <nav className="site-footer__links" aria-label="Footer navigation">
          <Link to="/">Home</Link>
          <Link to="/#services">Services</Link>
          <Link to="/#how-it-works">How it works</Link>
          {isAuthenticated ? (
            <Link to={dashboardPath}>Dashboard</Link>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register">Create account</Link>
            </>
          )}
        </nav>
      </div>

      <div className="site-footer__bottom">
        <span>&copy; {CURRENT_YEAR} Smart Campus Service Portal</span>
        <span>Built for a safer, more connected campus.</span>
      </div>
    </footer>
  );
}

export default Footer;
