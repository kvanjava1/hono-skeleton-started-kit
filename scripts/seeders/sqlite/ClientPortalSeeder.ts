import { eq } from "drizzle-orm";
import { getDrizzleDb } from "../../../src/database/drizzle.ts";
import { clientUsers } from "../../../src/database/schema/client/clientUser.schema.ts";
import { clients, clientMembers } from "../../../src/database/schema/client/client.schema.ts";
import { roles } from "../../../src/database/schema/admin/rbac.schema.ts";
import { logger } from "../../../src/utils/logger.util.ts";

export const seed = async (): Promise<void> => {
  logger.info("[ClientPortalSeeder] Running SQLite seeder: ClientPortalSeeder");
  const db = await getDrizzleDb("sqlite1");

  // 1. Create or Find Clients
  let [acme] = await db.select().from(clients).where(eq(clients.slug, "acme-corp")).limit(1);
  if (!acme) {
    [acme] = await db
      .insert(clients)
      .values({
        name: "Acme Corporation",
        slug: "acme-corp",
        status: "ACTIVE",
      })
      .returning();
  }

  let [beta] = await db.select().from(clients).where(eq(clients.slug, "beta-studio")).limit(1);
  if (!beta) {
    [beta] = await db
      .insert(clients)
      .values({
        name: "Beta Studio Tech",
        slug: "beta-studio",
        status: "ACTIVE",
      })
      .returning();
  }

  // 2. Find Roles
  const [roleOwner] = await db.select().from(roles).where(eq(roles.name, "Client Owner")).limit(1);
  const [roleDev] = await db.select().from(roles).where(eq(roles.name, "Client Developer")).limit(1);

  // 3. Create Demo Client Users
  const usersToSeed = [
    {
      name: "Alex Client",
      email: "client@example.com",
      password: "password",
      workspaces: [
        { client: acme!, role: roleOwner! },
        { client: beta!, role: roleDev! },
      ],
    },
    {
      name: "kress",
      email: "kvanjava1@gmail.com",
      password: "kvanjava1@gmail.com",
      workspaces: [
        { client: acme!, role: roleOwner! },
      ],
    },
  ];

  for (const u of usersToSeed) {
    let [clientUser] = await db
      .select()
      .from(clientUsers)
      .where(eq(clientUsers.email, u.email))
      .limit(1);

    if (!clientUser) {
      const passwordHash = await Bun.password.hash(u.password, { algorithm: "argon2id" });
      [clientUser] = await db
        .insert(clientUsers)
        .values({
          name: u.name,
          email: u.email,
          passwordHash,
          status: "ACTIVE",
          isActive: true,
          lastActiveClientId: u.workspaces[0]?.client?.id,
        })
        .returning();
      logger.info("[ClientPortalSeeder] Client user seeded", { email: u.email });
    }

    if (clientUser) {
      const existing = await db
        .select()
        .from(clientMembers)
        .where(eq(clientMembers.userId, clientUser.id));

      for (const ws of u.workspaces) {
        if (ws.client && ws.role && !existing.some((m) => m.clientId === ws.client.id)) {
          await db.insert(clientMembers).values({
            clientId: ws.client.id,
            userId: clientUser.id,
            roleId: ws.role.id,
            status: "ACTIVE",
          });
        }
      }
    }
  }

  logger.info("[ClientPortalSeeder] Seeding finished successfully");
};
