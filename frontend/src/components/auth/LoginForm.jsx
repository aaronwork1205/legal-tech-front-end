import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../state/authContext.jsx";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export const LoginForm = () => {
  const { login, isLoading, error } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);
  const [accountType, setAccountType] = useState("client");
  const {
    handleSubmit,
    register,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const onSubmit = async (values) => {
    try {
      await login(values, accountType);
    } catch {
      // error state handled via auth context
    }
  };

  const handleDemoLogin = async () => {
    if (accountType === "lawyer") return;
    setDemoLoading(true);
    try {
      await login({ email: "legal@nebulalabs.io", password: "LexiFlow#2024" }, accountType);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="account-switcher" role="tablist" aria-label="Select workspace type">
        <button
          type="button"
          role="tab"
          aria-selected={accountType === "client"}
          className={`account-switcher__option${accountType === "client" ? " account-switcher__option--active" : ""}`}
          onClick={() => setAccountType("client")}
        >
          <span className="account-switcher__label">Legal service user</span>
          <span className="account-switcher__helper">Manage matters, documents, and AI workspace</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={accountType === "lawyer"}
          className={`account-switcher__option${accountType === "lawyer" ? " account-switcher__option--active" : ""}`}
          onClick={() => setAccountType("lawyer")}
        >
          <span className="account-switcher__label">Lawyer</span>
          <span className="account-switcher__helper">Review assigned cases and client files</span>
        </button>
      </div>
      <label className="form-label">
        Work email
        <input className="input" type="email" placeholder="you@company.com" {...register("email")} />
        {errors.email ? <span className="error-text">{errors.email.message}</span> : null}
      </label>
      <label className="form-label">
        Password
        <input className="input" type="password" placeholder="••••••••" {...register("password")} />
        {errors.password ? <span className="error-text">{errors.password.message}</span> : null}
      </label>
      <div className="auth-row">
        <label className="checkbox">
          <input type="checkbox" defaultChecked /> Remember me
        </label>
        <a href="#">Forgot password?</a>
      </div>
      <button className="btn btn-primary" type="submit" disabled={isLoading || demoLoading}>
        {isLoading ? "Signing you in..." : accountType === "lawyer" ? "Sign in as lawyer" : "Sign in"}
      </button>
      <button
        className="btn btn-secondary"
        type="button"
        onClick={handleDemoLogin}
        disabled={isLoading || demoLoading || accountType === "lawyer"}
      >
        {accountType === "lawyer"
          ? "Request lawyer demo access"
          : demoLoading
          ? "Loading demo workspace..."
          : "Use demo workspace"}
      </button>
      {error ? <p className="error-text">{error}</p> : null}
    </form>
  );
};
