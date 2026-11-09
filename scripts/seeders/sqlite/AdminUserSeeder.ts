import { and, eq, isNull } from "drizzle-orm";
import { getDrizzleDb } from "../../../src/database/drizzle.ts";
import { users } from "../../../src/database/schema/admin/user.schema.ts";
import { configApp } from "../../../src/configs/index.ts";
import { logger } from "../../../src/utils/logger.util.ts";

/**
 * Seeds the first admin account for the dashboard login (plan D2/D3).
 *
 * DEV-ONLY CREDENTIALS — the password below is a placeholder for local
 * development. NEVER run this seeder in production: it refuses to insert
 * when `configApp.isProduction()` is true. If you must bootstrap a real
 * admin, create the account out-of-band and CHANGE THE PASSWORD right
 * after the first login.
 */
const ADMIN_NAME = "Admin";
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "admin123"; // dev placeholder — ganti setelah login pertama

export const seed = async (): Promise<void> => {
  if (configApp.isProduction()) {
    logger.warn(
      "[AdminUserSeeder] Skipped: production environment. Default credentials must never be seeded — create the admin out-of-band.",
    );
    return;
  }

  logger.info("[AdminUserSeeder] Running SQLite seeder: AdminUserSeeder");
  const db = await getDrizzleDb("sqlite1");

  // Idempotent: re-running the seeder must not duplicate the admin account.
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, ADMIN_EMAIL), isNull(users.deletedAt)))
    .limit(1);

  if (existing.length > 0) {
    logger.info("[AdminUserSeeder] Admin user already exists, skipping", {
      email: ADMIN_EMAIL,
    });
    return;
  }

  const passwordHash = await Bun.password.hash(ADMIN_PASSWORD, {
    algorithm: "argon2id",
  });

  await db.insert(users).values({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    passwordHash,
    isActive: true,
  });

  logger.info("[AdminUserSeeder] Admin user created", { email: ADMIN_EMAIL });
};
