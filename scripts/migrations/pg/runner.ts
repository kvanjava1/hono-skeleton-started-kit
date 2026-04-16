import { getPgSql } from "../../../src/database/pg.connection.ts";
import {
  getPgConnectionNames,
  type PgConnectionName,
} from "../../../src/configs/index.ts";
import type postgres from "postgres";

const CREATE_MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

export const assertPgMigrationTarget = (
  target: string,
): asserts target is PgConnectionName => {
  if (!getPgConnectionNames().includes(target as PgConnectionName)) {
    throw new Error(
      `PostgreSQL migration target "${target}" is invalid. Expected one of: ${getPgConnectionNames().join(", ")}`,
    );
  }
};

export interface PgMigration {
  name: string;
  target: PgConnectionName;
  up: (sql: postgres.Sql) => Promise<void>;
  down: (sql: postgres.Sql) => Promise<void>;
}

export const createMigrationsTable = async (
  connectionName: PgConnectionName,
): Promise<void> => {
  const sql = getPgSql(connectionName);
  await sql.unsafe(CREATE_MIGRATIONS_TABLE);
};

export const getExecutedMigrations = async (
  connectionName: PgConnectionName,
): Promise<string[]> => {
  const sql = getPgSql(connectionName);
  const rows = await sql<{ name: string }[]>`SELECT name FROM migrations ORDER BY id`;
  return rows.map((row) => row.name);
};

export const markMigrationAsExecuted = async (
  connectionName: PgConnectionName,
  name: string,
): Promise<void> => {
  const sql = getPgSql(connectionName);
  await sql`INSERT INTO migrations (name) VALUES (${name})`;
};

export const unmarkMigrationAsExecuted = async (
  connectionName: PgConnectionName,
  name: string,
): Promise<void> => {
  const sql = getPgSql(connectionName);
  await sql`DELETE FROM migrations WHERE name = ${name}`;
};
