import { getEnv, getEnvNumber } from "./env.ts";
import { configApp, createLazyConfig } from "./app.config.ts";

export interface ConfigSession {
  /**
   * HMAC secret for the signed session cookie. REQUIRED in production —
   * accessing the config without it throws at first use (fail fast).
   * Development falls back to a fixed insecure value so `bun run dev:all`
   * works out of the box; it must never reach a production machine.
   */
  secret: string;
  /** httpOnly signed cookie holding the session state. */
  cookieName: string;
  /** Non-httpOnly cookie the Inertia client mirrors into `X-XSRF-TOKEN`. */
  xsrfCookieName: string;
  /** Session + cookie lifetime in minutes. */
  ttlMinutes: number;
}

const { proxy: configSession, reset: resetConfigSession } = createLazyConfig(
  (): ConfigSession => ({
    secret: getEnv(
      "SESSION_SECRET",
      configApp.isProduction() ? undefined : "dev-insecure-session-secret",
    ),
    cookieName: getEnv("SESSION_COOKIE_NAME", "session"),
    xsrfCookieName: "XSRF-TOKEN",
    ttlMinutes: getEnvNumber("SESSION_TTL_MINUTES", 120),
  }),
);

export { configSession, resetConfigSession };

