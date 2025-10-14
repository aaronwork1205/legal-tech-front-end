import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout.jsx";
import { LoginForm } from "../components/auth/LoginForm.jsx";
import { useAuth } from "../state/authContext.jsx";

const LoginPage = () => {
  const { isAuthenticated, initialised } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialised && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, initialised, navigate]);

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your legal workspace, ongoing conversations, and plan controls."
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
