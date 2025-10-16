import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../state/authContext.jsx";

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().min(4, "Enter the 4+ character code we emailed").max(8)
});

export const VerifyEmailForm = () => {
  const { verifyEmail, isLoading, error } = useAuth();
  const {
    handleSubmit,
    register,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      email: "",
      code: ""
    }
  });

  const onSubmit = async (payload) => {
    await verifyEmail(payload);
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
      <p className="muted">
        We just sent a one-time verification code to your inbox. It expires in 5 minutes. Enter it below to unlock the
        workspace.
      </p>
      <label className="form-label">
        Work email
        <input className="input" type="email" placeholder="you@company.com" {...register("email")} />
        {errors.email ? <span className="error-text">{errors.email.message}</span> : null}
      </label>
      <label className="form-label">
        Verification code
        <input className="input" placeholder="123456" {...register("code")} />
        {errors.code ? <span className="error-text">{errors.code.message}</span> : null}
      </label>
      <button className="btn btn-primary" type="submit" disabled={isLoading}>
        {isLoading ? "Verifying..." : "Verify email"}
      </button>
      {error ? <p className="error-text">{error}</p> : null}
    </form>
  );
};
