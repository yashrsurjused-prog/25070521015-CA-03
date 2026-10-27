import { Link } from 'react-router-dom';

import ConnectionStatus from '../components/ConnectionStatus';
import Footer from '../components/Footer';
import useAuth from '../context/useAuth';

const iconProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

function ComplaintIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2h9A2.5 2.5 0 0 1 19 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 19.5z" />
      <path d="M8.5 7.5h7M8.5 11.5h7M8.5 15.5h4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 4.5 4.5M10.5 7.5v6M7.5 10.5h6" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 2.5 20 6v5.5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6z" />
      <path d="m8.5 12 2.3 2.3 4.7-4.8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg {...iconProps} width="18" height="18">
      <path d="m5 12 4 4 10-10" />
    </svg>
  );
}

const services = [
  {
    title: 'Campus complaints',
    description:
      'Report maintenance, cleanliness, safety, or facility issues and follow a clear status history from submission to resolution.',
    points: ['Structured issue details', 'Status tracking', 'Administrator review'],
    icon: <ComplaintIcon />,
  },
  {
    title: 'Lost & found',
    description:
      'Post lost or found items, search campus listings, and submit a claim when something belongs to you.',
    points: ['Campus-wide listing search', 'Claim verification', 'Return tracking'],
    icon: <SearchIcon />,
  },
  {
    title: 'Service transparency',
    description:
      'Every request has a visible owner, status, and decision trail, so students and staff know what happens next.',
    points: ['Clear ownership', 'Moderation records', 'Notification updates'],
    icon: <ShieldIcon />,
  },
];

const steps = [
  {
    title: 'Sign in with your campus account',
    description:
      'Use your student or administrator account. Access is role-aware, so each person sees the right workspace.',
  },
  {
    title: 'Submit or find a service request',
    description:
      'Create a complaint, report a lost or found item, or browse existing records from the service desk.',
  },
  {
    title: 'Track progress to resolution',
    description:
      'Follow status changes, claim decisions, and administrator updates without chasing multiple offices.',
  },
];

function Home() {
  const { isAuthenticated, isAdmin } = useAuth();
  const dashboardPath = isAdmin ? '/admin/dashboard' : '/student/dashboard';

  return (
    <div className="page page--public">
      <main>
        <section className="hero-section">
          <div className="hero-section__glow hero-section__glow--one" />
          <div className="hero-section__glow hero-section__glow--two" />
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">
                <span className="eyebrow__dot" aria-hidden="true" />
                One portal. Every campus service.
              </span>
              <h1>Campus support, without the runaround.</h1>
              <p className="hero-copy__lead">
                Smart Campus Service Portal brings complaint tracking and
                lost-and-found recovery into one clear, secure workspace for
                students and administrators.
              </p>
              <div className="hero-copy__actions">
                {isAuthenticated ? (
                  <Link className="button button--primary button--lg" to={dashboardPath}>
                    Open dashboard
                  </Link>
                ) : (
                  <>
                    <Link className="button button--primary button--lg" to="/register">
                      Create student account
                    </Link>
                    <Link className="button button--secondary button--lg" to="/login">
                      Log in
                    </Link>
                  </>
                )}
              </div>
              <div className="hero-copy__trust" aria-label="Platform attributes">
                <span>
                  <CheckIcon /> Role-based access
                </span>
                <span>
                  <CheckIcon /> Secure sessions
                </span>
                <span>
                  <CheckIcon /> Transparent updates
                </span>
              </div>
              <ConnectionStatus />
            </div>

            <div className="hero-panel" aria-label="Portal service overview">
              <div className="hero-panel__header">
                <div>
                  <span className="hero-panel__label">Service desk</span>
                  <h2>Campus services in one place</h2>
                </div>
                <span className="hero-panel__chip">Student &amp; admin</span>
              </div>

              <div className="service-preview">
                <div className="service-preview__item">
                  <span className="service-preview__icon">
                    <ComplaintIcon />
                  </span>
                  <div>
                    <strong>Complaint management</strong>
                    <p>Report, review, and resolve campus issues.</p>
                  </div>
                  <span className="service-preview__signal">Tracked</span>
                </div>
                <div className="service-preview__item">
                  <span className="service-preview__icon">
                    <SearchIcon />
                  </span>
                  <div>
                    <strong>Lost-and-found recovery</strong>
                    <p>Search listings and verify ownership claims.</p>
                  </div>
                  <span className="service-preview__signal">Verified</span>
                </div>
                <div className="service-preview__item">
                  <span className="service-preview__icon">
                    <ShieldIcon />
                  </span>
                  <div>
                    <strong>Administrator oversight</strong>
                    <p>Moderation decisions with a clear audit trail.</p>
                  </div>
                  <span className="service-preview__signal">Secure</span>
                </div>
              </div>

              <div className="hero-panel__footer">
                <span className="hero-panel__pulse" aria-hidden="true" />
                Designed for a safer, better-connected campus.
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="services">
          <div className="section-heading">
            <span className="section-heading__eyebrow">What you can do</span>
            <h2>Practical services for everyday campus life</h2>
            <p>
              The portal focuses on the requests students and administrators
              handle most often, with a workflow built around clarity.
            </p>
          </div>

          <div className="feature-grid">
            {services.map((service) => (
              <article className="feature-tile" key={service.title}>
                <span className="feature-tile__icon">{service.icon}</span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <ul className="feature-tile__list">
                  {service.points.map((point) => (
                    <li key={point}>
                      <CheckIcon />
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="section section--tinted" id="how-it-works">
          <div className="section-heading">
            <span className="section-heading__eyebrow">How it works</span>
            <h2>A straightforward service journey</h2>
            <p>
              No paper forms or unclear handoffs. Each step is designed around
              the people using the portal.
            </p>
          </div>

          <div className="steps-grid">
            {steps.map((step, index) => (
              <article className="step-card" key={step.title}>
                <span className="step-card__number">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-band">
          <div className="cta-band__content">
            <span className="section-heading__eyebrow">Ready when you are</span>
            <h2>Bring campus service requests into one clear view.</h2>
            <p>
              Sign in to reach your role-based workspace, or create a student
              account to get started.
            </p>
          </div>
          <div className="cta-band__actions">
            {isAuthenticated ? (
              <Link className="button button--light button--lg" to={dashboardPath}>
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link className="button button--light button--lg" to="/register">
                  Register
                </Link>
                <Link className="button button--outline-light button--lg" to="/login">
                  Log in
                </Link>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Home;
