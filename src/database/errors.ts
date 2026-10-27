/**
 * Database Vendor Error Detection Helpers
 * Detects common constraint violations across MySQL, PostgreSQL, MongoDB, and SQLite.
 */

export const isMySqlDuplicateError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  const error = err as {
    code?: string;
    errno?: number;
    sqlState?: string;
    message?: string;
  };
  return (
    error.code === "ER_DUP_ENTRY" ||
    error.errno === 1062 ||
    error.sqlState === "23000" ||
    (typeof error.message === "string" &&
      error.message.includes("Duplicate entry"))
  );
};

export const isPostgresDuplicateError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  return (err as { code?: string }).code === "23505";
};

export const isMongoDuplicateError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  return (err as { code?: number }).code === 11000;
};

export const isSqliteDuplicateError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  const error = err as { code?: string; message?: string };
  return (
    error.code === "SQLITE_CONSTRAINT_UNIQUE" ||
    error.code === "SQLITE_CONSTRAINT_PRIMARYKEY" ||
    (typeof error.message === "string" &&
      error.message.includes("UNIQUE constraint failed"))
  );
};

/**
 * Checks if the error is caused by a unique/primary key duplicate violation
 */
export const isDuplicateKeyError = (err: unknown): boolean => {
  return (
    isMySqlDuplicateError(err) ||
    isPostgresDuplicateError(err) ||
    isMongoDuplicateError(err) ||
    isSqliteDuplicateError(err)
  );
};

/**
 * Checks if the error is caused by a foreign key constraint violation
 */
export const isForeignKeyConstraintError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  const error = err as {
    code?: string | number;
    errno?: number;
    message?: string;
  };

  // PostgreSQL 23503 foreign_key_violation
  if (error.code === "23503") return true;

  // MySQL 1451 / 1452 ER_ROW_IS_REFERENCED / ER_NO_REFERENCED_ROW
  if (
    error.errno === 1451 ||
    error.errno === 1452 ||
    error.code === "ER_ROW_IS_REFERENCED" ||
    error.code === "ER_ROW_IS_REFERENCED_2" ||
    error.code === "ER_NO_REFERENCED_ROW" ||
    error.code === "ER_NO_REFERENCED_ROW_2"
  ) {
    return true;
  }

  // SQLite foreign key constraint failed
  if (
    error.code === "SQLITE_CONSTRAINT_FOREIGNKEY" ||
    (typeof error.message === "string" &&
      error.message.includes("FOREIGN KEY constraint failed"))
  ) {
    return true;
  }

  return false;
};
