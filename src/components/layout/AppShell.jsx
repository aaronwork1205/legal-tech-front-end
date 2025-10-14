import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../state/authContext.jsx";
import "./layout.css";

const navItems = [
  { to: "/dashboard", label: "Overview" },
  { to: "/dashboard#assistant", label: "AI Assistant" },
  { to: "/dashboard#plans", label: "Plans" },
  { to: "/demo", label: "Demo Lab" }
];

export const AppShell = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="logo">
          <Link to={isAuthenticated ? "/dashboard" : "/"}>
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
                <span className="pill">{user.subscription?.toUpperCase() ?? "FREE"}</span>
                <div>
                  <p>{user.companyName}</p>
                  <small>{user.email}</small>
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
