import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../state/authContext.jsx";
import "./layout.css";

const AUTH_NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/assistant", label: "AI Workspace" }
];

const LAWYER_NAV_ITEMS = [{ to: "/lawyer/cases", label: "Case desk" }];

const MARKETING_NAV_ITEMS = [
  { to: "/", label: "Product" },
  { to: "/demo", label: "Demo Lab" }
];

export const AppShell = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const navItems = isAuthenticated
    ? user?.role === "lawyer"
      ? LAWYER_NAV_ITEMS
      : AUTH_NAV_ITEMS
    : MARKETING_NAV_ITEMS;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="logo">
          <Link to={isAuthenticated ? (user?.role === "lawyer" ? "/lawyer/cases" : "/dashboard") : "/"}>
            <span className="logo-text">LexiFlow</span>
          </Link>
        </div>
        <nav>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className="nav-link">
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              <div className="user-badge">
                <span className="pill">
                  {user.role === "lawyer" ? "LAWYER" : user.subscription?.toUpperCase() ?? "FREE"}
                </span>
                <div>
                  <p>{user.companyName}</p>
                  <small>
                    {user.email}
                    {user.role === "lawyer" ? " · Lawyer workspace" : ""}
                  </small>
                </div>
              </div>
              <button className="btn btn-secondary" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <div className="cta-group">
              <Link className="btn btn-secondary" to="/login">
                Sign in
              </Link>
              <Link className="btn btn-primary" to="/signup">
                Get started
              </Link>
            </div>
          )}
        </div>
      </header>
      <main className="app-main">{children}</main>
      <footer className="site-footer">
        <div>
          <p className="footer-title">LexiFlow</p>
          <p className="muted">Accelerating legal clarity for high-growth teams.</p>
        </div>
        <div className="footer-links">
          <a href="#">Security whitepaper</a>
          <a href="#">Attorney partner program</a>
          <a href="#">Contact us</a>
        </div>
        <div className="footer-right">
          <label className="newsletter">
            <span>Subscribe to product updates</span>
            <input type="email" placeholder="work@company.com" className="input" />
          </label>
          <button className="btn btn-primary">Subscribe</button>
        </div>
      </footer>
    </div>
  );
};
