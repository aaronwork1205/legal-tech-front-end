import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../state/authContext.jsx";

export const ProtectedRoute = () => {
  const { isAuthenticated, initialised, status } = useAuth();
  const location = useLocation();

  if (!initialised || status === "loading") {
    return (
      <div className="container" style={{ padding: "6rem 0", textAlign: "center" }}>
        <p className="muted">Preparing your workspace...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};
