import type { Config } from "drizzle-kit";

export default {
  schema: "./src/database/schema/**/*",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: "./data/sqlite1.db",
  },
} satisfies Config;
