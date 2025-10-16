import { Navigate } from "react-router-dom";
import { useAuth } from "../../state/authContext.jsx";

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, initialised, status } = useAuth();

  if (!initialised || status === "loading") {
    return (
      <div className="container" style={{ padding: "6rem 0", textAlign: "center" }}>
        <p className="muted">Preparing your workspace...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
