import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
  getDrizzleSqliteDb,
  getDrizzleDb,
  getDrizzleMysqlDb,
  getDrizzlePgDb,
  closeAllDrizzleDbs,
} from "../../src/database/drizzle.ts";
import { configApp } from "../../src/configs/index.ts";

describe("Drizzle ORM Multi-Database Client", () => {
  const originalMysqlEnabled = configApp.db.mysql;
  const originalPgEnabled = configApp.db.pg;

  afterEach(() => {
    closeAllDrizzleDbs();
    configApp.db.mysql = originalMysqlEnabled;
    configApp.db.pg = originalPgEnabled;
  });

  it("returns a valid Drizzle SQLite database instance", async () => {
    const db1 = await getDrizzleSqliteDb("sqlite1");
    const db2 = await getDrizzleDb("sqlite1");

    expect(db1).toBeDefined();
    expect(db1).toBe(db2); // cached instance
  });

  it("throws descriptive error when MySQL is disabled", () => {
    configApp.db.mysql = false;
    expect(() => getDrizzleMysqlDb("mysql1")).toThrow(
      "MySQL is disabled in configuration",
    );
  });

  it("throws descriptive error when PostgreSQL is disabled", () => {
    configApp.db.pg = false;
    expect(() => getDrizzlePgDb("pg1")).toThrow(
      "PostgreSQL is disabled in configuration",
    );
  });

  it("clears all client caches on closeAllDrizzleDbs", async () => {
    const db1 = await getDrizzleSqliteDb("sqlite1");
    closeAllDrizzleDbs();
    const db2 = await getDrizzleSqliteDb("sqlite1");
    expect(db1).toBeDefined();
    expect(db2).toBeDefined();
  });
});
