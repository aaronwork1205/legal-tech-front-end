import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout.jsx";
import { LoginForm } from "../components/auth/LoginForm.jsx";
import { useAuth } from "../state/authContext.jsx";

const LoginPage = () => {
  const { isAuthenticated, initialised, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialised && isAuthenticated) {
      const destination = user?.role === "lawyer" ? "/lawyer/cases" : "/dashboard";
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, initialised, navigate, user]);

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Pick an account type to continue. Clients manage their legal workspace while lawyers review assigned matters."
      footer={
        <span>
          Don&apos;t have an account? <Link to="/signup">Create one</Link>.
        </span>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default LoginPage;
