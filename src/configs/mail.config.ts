import { getStringValue, getNumberValue, getBoolValue } from "./env.ts";

export type MailDriverType = "log" | "smtp" | "resend";

export interface ConfigMail {
  driver: MailDriverType;
  from: {
    address: string;
    name: string;
  };
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth?: {
      user: string;
      pass: string;
    };
  };
  resend: {
    apiKey?: string;
  };
}

const buildConfigMail = (
  env: Record<string, string | undefined> = process.env,
): ConfigMail => {
  const rawDriver = getStringValue(env, "MAIL_DRIVER", "log").toLowerCase();
  const driver: MailDriverType =
    rawDriver === "smtp" || rawDriver === "resend" ? rawDriver : "log";

  const host = getStringValue(env, "MAIL_HOST", "127.0.0.1");
  const port = getNumberValue(env, "MAIL_PORT", 1025);

  const encryption = getStringValue(env, "MAIL_ENCRYPTION", "none").toLowerCase();
  const secure =
    port === 465 || encryption === "ssl" || getBoolValue(env, "MAIL_SECURE", false);

  const user = env.MAIL_USERNAME || undefined;
  const pass = env.MAIL_PASSWORD || undefined;
  const auth = user && pass ? { user, pass } : undefined;

  return {
    driver,
    from: {
      address: getStringValue(env, "MAIL_FROM_ADDRESS", "noreply@example.com"),
      name: getStringValue(env, "MAIL_FROM_NAME", "Hono Skeleton"),
    },
    smtp: {
      host,
      port,
      secure,
      auth,
    },
    resend: {
      apiKey: env.RESEND_API_KEY || undefined,
    },
  };
};

function createLazyConfig<T extends object>(
  build: (env?: Record<string, string | undefined>) => T,
): { proxy: T; reset(): void } {
  let cached: T | null = null;
  return {
    proxy: new Proxy<T>({} as T, {
      get(_, prop) {
        if (!cached) cached = build();
        return cached[prop as keyof T];
      },
    }),
    reset: () => {
      cached = null;
    },
  };
}

const { proxy: configMail, reset: resetConfigMail } = createLazyConfig(buildConfigMail);

export { configMail, resetConfigMail, buildConfigMail };
