import { getSqliteDb } from "../../../database/sqlite.connection.ts";

export interface ExampleRecord {
  id: number;
  full_name: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ExampleListFilters {
  id?: number;
  full_name?: string;
  email?: string;
}

export interface CreateExampleRecordInput {
  full_name: string;
  email: string;
  password: string;
}

export interface UpdateExampleRecordInput {
  full_name: string;
  email: string;
  password: string;
}

const BASE_SELECT = `
  SELECT
    id,
    full_name,
    email,
    password,
    created_at,
    updated_at,
    deleted_at
  FROM examples
`;

const getDb = () => getSqliteDb("sqlite1");

const buildFilters = (filters: ExampleListFilters) => {
  const clauses = ["deleted_at IS NULL"];
  const params: Array<string | number> = [];

  if (filters.id) {
    clauses.push("id = ?");
    params.push(filters.id);
  }

  if (filters.full_name) {
    clauses.push("full_name LIKE ?");
    params.push(`%${filters.full_name}%`);
  }

  if (filters.email) {
    clauses.push("email LIKE ?");
    params.push(`%${filters.email}%`);
  }

  return {
    whereClause: `WHERE ${clauses.join(" AND ")}`,
    params,
  };
};

export const countExamples = (filters: ExampleListFilters): number => {
  const db = getDb();
  const { whereClause, params } = buildFilters(filters);
  const row = db
    .query<{ total: number }, Array<string | number>>(
      `SELECT COUNT(*) AS total FROM examples ${whereClause}`,
    )
    .get(...params);

  return row?.total ?? 0;
};

export const findExamples = (
  page: number,
  limit: number,
  filters: ExampleListFilters,
): ExampleRecord[] => {
  const db = getDb();
  const offset = (page - 1) * limit;
  const { whereClause, params } = buildFilters(filters);

  return db
    .query<ExampleRecord, Array<string | number>>(
      `
        ${BASE_SELECT}
        ${whereClause}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `,
    )
    .all(...params, limit, offset);
};

export const findExampleById = (id: number): ExampleRecord | null => {
  const db = getDb();
  const row = db
    .query<ExampleRecord, [number]>(
      `
        ${BASE_SELECT}
        WHERE id = ?
          AND deleted_at IS NULL
        LIMIT 1
      `,
    )
    .get(id);

  return row ?? null;
};

export const findExampleByEmail = (email: string): ExampleRecord | null => {
  const db = getDb();
  const row = db
    .query<ExampleRecord, [string]>(
      `
        ${BASE_SELECT}
        WHERE email = ?
          AND deleted_at IS NULL
        LIMIT 1
      `,
    )
    .get(email);

  return row ?? null;
};

export const createExample = (
  input: CreateExampleRecordInput,
): ExampleRecord => {
  const db = getDb();
  const statement = db.query<never, [string, string, string]>(
    `
      INSERT INTO examples (
        full_name,
        email,
        password,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `,
  );

  statement.run(input.full_name, input.email, input.password);

  const createdExample = findExampleById(
    Number(
      db.query<{ id: number }, []>("SELECT last_insert_rowid() AS id").get()
        ?.id,
    ),
  );

  if (!createdExample) {
    throw new Error("Failed to fetch created example");
  }

  return createdExample;
};

export const updateExample = (
  id: number,
  input: UpdateExampleRecordInput,
): ExampleRecord | null => {
  const db = getDb();
  const statement = db.query<never, [string, string, string, number]>(
    `
      UPDATE examples
      SET
        full_name = ?,
        email = ?,
        password = ?,
        updated_at = datetime('now')
      WHERE id = ?
        AND deleted_at IS NULL
    `,
  );

  const result = statement.run(
    input.full_name,
    input.email,
    input.password,
    id,
  );

  if (result.changes === 0) {
    return null;
  }

  return findExampleById(id);
};

export const softDeleteExample = (id: number): boolean => {
  const db = getDb();
  const statement = db.query<never, [number]>(
    `
      UPDATE examples
      SET
        deleted_at = datetime('now'),
        updated_at = datetime('now')
      WHERE id = ?
        AND deleted_at IS NULL
    `,
  );

  const result = statement.run(id);

  return result.changes > 0;
};
