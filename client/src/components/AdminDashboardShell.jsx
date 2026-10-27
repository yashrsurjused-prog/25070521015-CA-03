import AdminSidebar from './AdminSidebar';

function AdminDashboardShell({ eyebrow, title, description, actions, children }) {
  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <AdminSidebar />
        <section className="dashboard-main">
          <header className="dashboard-header">
            <div>
              <span className="dashboard-header__eyebrow">{eyebrow}</span>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
            {actions && <div className="dashboard-header__actions">{actions}</div>}
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}

export default AdminDashboardShell;
