import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../state/authContext.jsx";
import { subscriptionTiers } from "../../data/subscriptions.js";

const registerSchema = z
  .object({
    companyName: z.string().min(2, "Company name is required"),
    email: z.string().email(),
    password: z
      .string()
      .min(8, "Password needs at least 8 characters")
      .regex(/[0-9]/, "Include a number")
      .regex(/[A-Z]/, "Include an uppercase letter"),
    confirmPassword: z.string(),
    plan: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"]
  });

export const RegisterForm = () => {
  const { register: signUp, isLoading, error } = useAuth();
  const {
    handleSubmit,
    register,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: "",
      email: "",
      password: "",
      confirmPassword: "",
      plan: subscriptionTiers[0].id
    }
  });

  const onSubmit = async ({ companyName, email, password, plan }) => {
    await signUp({ companyName, email, password, plan });
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
      <label className="form-label">
        Company name
        <input className="input" placeholder="Nebula Labs" {...register("companyName")} />
        {errors.companyName ? <span className="error-text">{errors.companyName.message}</span> : null}
      </label>
      <label className="form-label">
        Work email
        <input className="input" type="email" placeholder="legal@company.com" {...register("email")} />
        {errors.email ? <span className="error-text">{errors.email.message}</span> : null}
      </label>
      <label className="form-label">
        Password
        <input className="input" type="password" placeholder="Use 8+ chars with strength" {...register("password")} />
        {errors.password ? <span className="error-text">{errors.password.message}</span> : null}
      </label>
      <label className="form-label">
        Confirm password
        <input className="input" type="password" placeholder="Repeat password" {...register("confirmPassword")} />
        {errors.confirmPassword ? <span className="error-text">{errors.confirmPassword.message}</span> : null}
      </label>
      <label className="form-label">
        Choose plan
        <select className="select" {...register("plan")}>
          {subscriptionTiers.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} — ¥{plan.price} / {plan.cadence}
            </option>
          ))}
        </select>
      </label>
      <button className="btn btn-primary" type="submit" disabled={isLoading}>
        {isLoading ? "Creating workspace..." : "Create account"}
      </button>
      {error ? <p className="error-text">{error}</p> : null}
    </form>
  );
};
