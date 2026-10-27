import { Link } from 'react-router-dom';

const benefits = [
  'Track complaint progress in one place',
  'Search and claim lost-and-found items',
  'Role-aware access for students and staff',
];

function CheckMark() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4 10-10" />
    </svg>
  );
}

function AuthShell({ eyebrow, title, description, children }) {
  return (
    <main className="auth-page">
      <div className="auth-shell">
        <aside className="auth-aside">
          <div>
            <Link className="auth-aside__brand" to="/">
              <span className="brand__mark" aria-hidden="true">
                SC
              </span>
              <span>
                <strong>Smart Campus</strong>
                <span>Service Portal</span>
              </span>
            </Link>
            <span className="auth-aside__eyebrow">Campus services, simplified</span>
            <h1>One secure space for the requests that keep campus moving.</h1>
            <p>
              Report issues, recover lost belongings, and stay informed without
              visiting multiple offices.
            </p>
            <ul className="auth-aside__list">
              {benefits.map((benefit) => (
                <li key={benefit}>
                  <CheckMark />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="auth-aside__note">
            <span className="auth-aside__note-icon" aria-hidden="true">
              i
            </span>
            <p>
              Administrator accounts are created by campus staff. Public
              registration is for students only.
            </p>
          </div>
        </aside>

        <section className="auth-card">
          <div className="auth-card__heading">
            <span className="auth-card__eyebrow">{eyebrow}</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}

export default AuthShell;
