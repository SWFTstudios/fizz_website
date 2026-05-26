import type { Env } from "../index";

export function requiredEnv(env: Env, key: keyof Env): string {
  const value = env[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing required env var: ${String(key)}`);
  }
  return value;
}

