import { getMysqlPool } from "../../../src/database/mysql.connection.ts";
import {
  getMysqlConnectionNames,
  type MysqlConnectionName,
} from "../../../src/configs/index.ts";

const CREATE_MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

export const assertMysqlMigrationTarget = (
  target: string,
): asserts target is MysqlConnectionName => {
  if (!getMysqlConnectionNames().includes(target as MysqlConnectionName)) {
    throw new Error(
      `MySQL migration target "${target}" is invalid. Expected one of: ${getMysqlConnectionNames().join(", ")}`,
    );
  }
};

export interface MySqlMigration {
  name: string;
  target: MysqlConnectionName;
  up: (pool: ReturnType<typeof getMysqlPool>) => Promise<void>;
  down: (pool: ReturnType<typeof getMysqlPool>) => Promise<void>;
}

export const createMigrationsTable = async (
  connectionName: MysqlConnectionName,
): Promise<void> => {
  const pool = getMysqlPool(connectionName);
  await pool.execute(CREATE_MIGRATIONS_TABLE);
};

export const getExecutedMigrations = async (
  connectionName: MysqlConnectionName,
): Promise<string[]> => {
  const pool = getMysqlPool(connectionName);
  const [rows] = await pool.execute("SELECT name FROM migrations ORDER BY id");
  return (rows as { name: string }[]).map((row) => row.name);
};

export const markMigrationAsExecuted = async (
  connectionName: MysqlConnectionName,
  name: string,
): Promise<void> => {
  const pool = getMysqlPool(connectionName);
  await pool.execute("INSERT INTO migrations (name) VALUES (?)", [name]);
};

export const unmarkMigrationAsExecuted = async (
  connectionName: MysqlConnectionName,
  name: string,
): Promise<void> => {
  const pool = getMysqlPool(connectionName);
  await pool.execute("DELETE FROM migrations WHERE name = ?", [name]);
};
