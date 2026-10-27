import { Link } from 'react-router-dom';

import Footer from '../components/Footer';
import useAuth from '../context/useAuth';

function NotFound() {
  const { isAuthenticated, isAdmin } = useAuth();
  const dashboardPath = isAdmin ? '/admin/dashboard' : '/student/dashboard';

  return (
    <div className="page page--public">
      <main className="not-found">
        <div className="not-found__card">
          <span className="not-found__code">404</span>
          <span className="not-found__eyebrow">Page not found</span>
          <h1>This page is not on the campus map.</h1>
          <p>
            The address may be incorrect, or the page may have moved. Use the
            links below to get back to a working part of the portal.
          </p>
          <div className="not-found__actions">
            <Link className="button button--primary button--lg" to="/">
              Back to homepage
            </Link>
            <Link
              className="button button--secondary button--lg"
              to={isAuthenticated ? dashboardPath : '/login'}
            >
              {isAuthenticated ? 'Open dashboard' : 'Log in'}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default NotFound;
