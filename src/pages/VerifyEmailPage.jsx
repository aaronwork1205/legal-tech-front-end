import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthLayout } from "../components/auth/AuthLayout.jsx";
import { VerifyEmailForm } from "../components/auth/VerifyEmailForm.jsx";
import { useAuth } from "../state/authContext.jsx";

const VerifyEmailPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user?.verified) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <AuthLayout
      title="Verify your workspace email"
      subtitle="Enter the code sent to your inbox to activate the AI attorney console."
      footer={
        <span>
          Need to resend the code? <Link to="/signup">Create account again</Link> or check your spam folder.
        </span>
      }
    >
      <VerifyEmailForm />
    </AuthLayout>
  );
};

export default VerifyEmailPage;
