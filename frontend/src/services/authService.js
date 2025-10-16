const SESSION_KEY = "lexiflow:session";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    },
    ...options
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const data = await response.json();
      message = data.error ?? message;
    } catch {
      // ignore parsing errors
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  return data;
};

const persistSession = (user) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
};

export const readSession = () => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearSession = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
};

const normaliseUser = (payload) => {
  if (!payload) return null;
  return {
    id: payload.id,
    companyName: payload.companyName,
    email: payload.email,
    verified: Boolean(payload.verified),
    subscription: payload.subscription ?? "starter",
    createdAt: payload.createdAt
  };
};

export const register = async ({ companyName, email, password, plan }) => {
  const { user } = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ companyName, email, password, plan })
  });
  const normalised = normaliseUser(user);
  persistSession(normalised);
  return normalised;
};

export const login = async ({ email, password }) => {
  const { user } = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  const normalised = normaliseUser(user);
  persistSession(normalised);
  return normalised;
};

export const verifyEmail = async ({ email, code }) => {
  const { user } = await request("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ email, code })
  });
  const normalised = normaliseUser(user);
  persistSession(normalised);
  return normalised;
};

export const updateSubscription = async ({ email, plan }) => {
  const { user } = await request("/auth/subscription", {
    method: "POST",
    body: JSON.stringify({ email, plan })
  });
  const normalised = normaliseUser(user);
  persistSession(normalised);
  return normalised;
};
