import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { clearSession, login, readSession, register, updateSubscription, verifyEmail } from "../services/authService.js";

const AuthContext = createContext(null);

const initialState = {
  user: null,
  status: "idle",
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case "INIT":
      return { ...state, user: action.payload, status: "ready" };
    case "LOGIN_REQUEST":
    case "REGISTER_REQUEST":
    case "VERIFY_REQUEST":
    case "PLAN_REQUEST":
      return { ...state, status: "loading", error: null };
    case "LOGIN_SUCCESS":
    case "REGISTER_SUCCESS":
    case "VERIFY_SUCCESS":
    case "PLAN_SUCCESS":
      return { ...state, user: action.payload, status: "ready", error: null };
    case "ERROR":
      return { ...state, status: "error", error: action.payload };
    case "LOGOUT":
      return { ...state, user: null, status: "idle", error: null };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    const session = readSession();
    if (session) {
      dispatch({ type: "INIT", payload: session });
    }
    setInitialised(true);
  }, []);

  const handleLogin = useCallback(async (credentials, expectedRole) => {
    dispatch({ type: "LOGIN_REQUEST" });
    try {
      const user = await login(credentials);
      if (expectedRole && user.role !== expectedRole) {
        clearSession();
        throw new Error(
          expectedRole === "lawyer"
            ? "This account is not registered as a lawyer workspace."
            : "This account is not registered as a client workspace."
        );
      }
      dispatch({ type: "LOGIN_SUCCESS", payload: user });
      return user;
    } catch (error) {
      dispatch({ type: "ERROR", payload: error.message });
      throw error;
    }
  }, []);

  const handleRegister = useCallback(async (payload) => {
    dispatch({ type: "REGISTER_REQUEST" });
    try {
      const user = await register(payload);
      dispatch({ type: "REGISTER_SUCCESS", payload: user });
      return user;
    } catch (error) {
      dispatch({ type: "ERROR", payload: error.message });
      throw error;
    }
  }, []);

  const handleVerify = useCallback(async (payload) => {
    dispatch({ type: "VERIFY_REQUEST" });
    try {
      const user = await verifyEmail(payload);
      dispatch({ type: "VERIFY_SUCCESS", payload: user });
      return user;
    } catch (error) {
      dispatch({ type: "ERROR", payload: error.message });
      throw error;
    }
  }, []);

  const handlePlanChange = useCallback(
    async (plan) => {
      if (!state.user) return null;
      dispatch({ type: "PLAN_REQUEST" });
      try {
        const user = await updateSubscription({ email: state.user.email, plan });
        dispatch({ type: "PLAN_SUCCESS", payload: user });
        return user;
      } catch (error) {
        dispatch({ type: "ERROR", payload: error.message });
        throw error;
      }
    },
    [state.user]
  );

  const handleLogout = useCallback(() => {
    clearSession();
    dispatch({ type: "LOGOUT" });
  }, []);

  const value = useMemo(
    () => ({
      user: state.user,
      status: state.status,
      error: state.error,
      isLoading: state.status === "loading",
      isAuthenticated: Boolean(state.user),
      login: handleLogin,
      register: handleRegister,
      verifyEmail: handleVerify,
      changePlan: handlePlanChange,
      logout: handleLogout,
      initialised
    }),
    [state, initialised, handleLogin, handleRegister, handleVerify, handlePlanChange, handleLogout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
