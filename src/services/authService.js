const USERS_KEY = "lexiflow:users";
const SESSION_KEY = "lexiflow:session";

const defaultUsers = [
  {
    id: "seed-user",
    companyName: "Nebula Labs",
    email: "legal@nebulalabs.io",
    password: "LexiFlow#2024",
    verified: true,
    subscription: "growth"
  }
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isBrowser = () => typeof window !== "undefined" && !!window.localStorage;

const readUsers = () => {
  if (!isBrowser()) return [...defaultUsers];
  const raw = window.localStorage.getItem(USERS_KEY);
  if (!raw) return [...defaultUsers];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...defaultUsers];
  } catch {
    return [...defaultUsers];
  }
};

const writeUsers = (users) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const writeSession = (user) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
};

export const readSession = () => {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearSession = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(SESSION_KEY);
};

export const register = async ({ companyName, email, password, plan }) => {
  await sleep(850);
  const users = readUsers();
  if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("Account already exists. Try signing in.");
  }
  const user = {
    id: `user-${Date.now()}`,
    companyName,
    email,
    password,
    verified: false,
    subscription: plan ?? "starter"
  };
  users.push(user);
  writeUsers(users);
  return { ...user, password: undefined };
};

export const login = async ({ email, password }) => {
  await sleep(600);
  const users = readUsers();
  const found = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  if (!found || found.password !== password) {
    throw new Error("Invalid credentials. Check your email and password.");
  }
  const sessionUser = { ...found };
  delete sessionUser.password;
  writeSession(sessionUser);
  return sessionUser;
};

export const verifyEmail = async ({ email, code }) => {
  await sleep(500);
  if (!code || code.length < 4) {
    throw new Error("Verification code is invalid.");
  }
  const users = readUsers();
  const found = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  if (!found) {
    throw new Error("No account found for this email.");
  }
  found.verified = true;
  writeUsers(users);
  writeSession({ ...found, password: undefined });
  return { ...found, password: undefined };
};

export const updateSubscription = async ({ email, plan }) => {
  await sleep(400);
  const users = readUsers();
  const found = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  if (!found) {
    throw new Error("Unable to update plan for unknown account.");
  }
  found.subscription = plan;
  writeUsers(users);
  writeSession({ ...found, password: undefined });
  return { ...found, password: undefined };
};
