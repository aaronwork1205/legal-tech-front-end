import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell.jsx";

const NotFoundPage = () => (
  <AppShell>
    <div className="container" style={{ padding: "6rem 0", textAlign: "center" }}>
      <h1 className="section-title">We couldn&apos;t find that page</h1>
      <p className="muted">The link may be outdated or the resource has moved.</p>
      <div style={{ marginTop: "1.8rem" }}>
        <Link className="btn btn-primary" to="/dashboard">
          Go to dashboard
        </Link>
        <Link className="btn btn-secondary" style={{ marginLeft: "0.8rem" }} to="/">
          Back to home
        </Link>
      </div>
    </div>
  </AppShell>
);

export default NotFoundPage;
