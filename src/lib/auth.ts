export type User = { username: string; createdAt: number };

const USERS_KEY = "ai_interview_users";
const SESSION_KEY = "ai_interview_session";

type StoredUser = User & { password: string };

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function signup(username: string, password: string): User {
  username = username.trim();
  if (username.length < 2) throw new Error("Username must be at least 2 characters");
  if (password.length < 4) throw new Error("Password must be at least 4 characters");
  const users = readUsers();
  if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("Username already taken");
  }
  const user: StoredUser = { username, password, createdAt: Date.now() };
  users.push(user);
  writeUsers(users);
  const session = { username, createdAt: user.createdAt };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function login(username: string, password: string): User {
  const users = readUsers();
  const found = users.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password,
  );
  if (!found) throw new Error("Invalid username or password");
  const session = { username: found.username, createdAt: found.createdAt };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}
