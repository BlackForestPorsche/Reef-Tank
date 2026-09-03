import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const DATA_DIR = join(process.cwd(), "data");
const HELM_DB = join(DATA_DIR, "helm.db");
const LEGACY_DB = join(DATA_DIR, "reefdeck.db");
const COOKIE = "sightglass_session";
const LEGACY_COOKIE = "reefdeck_session";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: number;
  owner: boolean;
};

export type PublicUser = {
  id: string;
  email: string;
  owner: boolean;
  createdAt: number;
};

let db: DatabaseSync | null = null;

function secret() {
  return (
    process.env.HELM_AUTH_SECRET ??
    process.env.REEFDECK_AUTH_SECRET ??
    "helm-alpha-dev-secret"
  );
}

function dbPath() {
  if (existsSync(HELM_DB)) return HELM_DB;
  if (existsSync(LEGACY_DB)) return LEGACY_DB;
  return HELM_DB;
}

function open(): DatabaseSync {
  if (db) return db;
  mkdirSync(DATA_DIR, { recursive: true });
  const next = new DatabaseSync(dbPath());
  next.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      owner INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
  db = next;
  return next;
}

function hashPassword(password: string, salt?: string) {
  const s = salt ?? randomBytes(16).toString("hex");
  const hash = scryptSync(password, s, 32).toString("hex");
  return `${s}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 32);
  const prev = Buffer.from(hash, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

function signToken(raw: string) {
  const mac = createHmac("sha256", secret()).update(raw).digest("hex");
  return `${raw}.${mac}`;
}

function verifyToken(token: string | null) {
  if (!token) return null;
  const cut = token.lastIndexOf(".");
  if (cut < 1) return null;
  const raw = token.slice(0, cut);
  const mac = token.slice(cut + 1);
  const expect = createHmac("sha256", secret()).update(raw).digest("hex");
  const a = Buffer.from(mac);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return raw;
}

export function publicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, owner: user.owner, createdAt: user.createdAt };
}

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    email: String(row.email),
    passwordHash: String(row.password_hash),
    createdAt: Number(row.created_at),
    owner: Number(row.owner) === 1,
  };
}

export function register(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) throw new Error("Enter a valid email.");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  const database = open();
  const existing = database.prepare("SELECT id FROM users WHERE email = ?").get(normalized);
  if (existing) throw new Error("That email is already on this Helm.");
  const count = database.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  const user: User = {
    id: randomBytes(8).toString("hex"),
    email: normalized,
    passwordHash: hashPassword(password),
    createdAt: Date.now(),
    owner: Number(count.n) === 0,
  };
  database
    .prepare(
      "INSERT INTO users (id, email, password_hash, created_at, owner) VALUES (?, ?, ?, ?, ?)",
    )
    .run(user.id, user.email, user.passwordHash, user.createdAt, user.owner ? 1 : 0);
  const token = issue(database, user.id);
  return { user: publicUser(user), token };
}

export function login(email: string, password: string) {
  const database = open();
  const row = database
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.trim().toLowerCase()) as Record<string, unknown> | undefined;
  if (!row) throw new Error("Email or password is wrong.");
  const user = rowToUser(row);
  if (!verifyPassword(password, user.passwordHash)) {
    throw new Error("Email or password is wrong.");
  }
  const token = issue(database, user.id);
  return { user: publicUser(user), token };
}

function issue(database: DatabaseSync, userId: string) {
  const raw = randomBytes(24).toString("hex");
  database.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
  database
    .prepare("INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)")
    .run(raw, userId, Date.now());
  return signToken(raw);
}

export function logout(token: string | null) {
  const raw = verifyToken(token);
  if (!raw) return;
  open().prepare("DELETE FROM sessions WHERE token = ?").run(raw);
}

export function userFromToken(token: string | null): PublicUser | null {
  const raw = verifyToken(token);
  if (!raw) return null;
  const row = open()
    .prepare(
      `SELECT u.id, u.email, u.password_hash, u.created_at, u.owner
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`,
    )
    .get(raw) as Record<string, unknown> | undefined;
  return row ? publicUser(rowToUser(row)) : null;
}

export function tokenFromRequest(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) return header.slice(7).trim();
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(
    new RegExp(`(?:^|;\\s*)(?:${COOKIE}|${LEGACY_COOKIE})=([^;]+)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function requireUser(request: Request) {
  const user = userFromToken(tokenFromRequest(request));
  if (!user) {
    const err = new Error("Sign in required.");
    (err as Error & { status: number }).status = 401;
    throw err;
  }
  return user;
}

export function sessionCookie(token: string) {
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`;
}

export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function dbExists() {
  return existsSync(dbPath());
}

export function dataDir() {
  return dirname(dbPath());
}
