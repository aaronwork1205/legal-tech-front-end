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
    await login(values);
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      await login({ email: "legal@nebulalabs.io", password: "LexiFlow#2024" });
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
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
        {isLoading ? "Signing you in..." : "Sign in"}
      </button>
      <button
        className="btn btn-secondary"
        type="button"
        onClick={handleDemoLogin}
        disabled={isLoading || demoLoading}
      >
        {demoLoading ? "Loading demo workspace..." : "Use demo workspace"}
      </button>
      {error ? <p className="error-text">{error}</p> : null}
    </form>
  );
};
