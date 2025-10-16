import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout.jsx";
import { RegisterForm } from "../components/auth/RegisterForm.jsx";
import { useAuth } from "../state/authContext.jsx";

const RegisterPage = () => {
  const { isAuthenticated, initialised } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialised && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [initialised, isAuthenticated, navigate]);

  return (
    <AuthLayout
      title="Create your LexiFlow workspace"
      subtitle="Invite the AI legal assistant and attorney network into your SaaS launch workflow."
      footer={
        <span>
          Already have an account? <Link to="/login">Sign in</Link>.
        </span>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
};

export default RegisterPage;
