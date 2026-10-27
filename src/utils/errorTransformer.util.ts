import { ZodError } from "zod";
import { ConflictError, ValidationError } from "./errors.util.ts";
import {
  isDuplicateKeyError,
  isForeignKeyConstraintError,
} from "../database/errors.ts";

export const DUPLICATE_ENTRY_MESSAGE = "The data you provided already exists.";
export const FOREIGN_KEY_MESSAGE =
  "The requested operation violates a relation constraint.";
export const MALFORMED_JSON_MESSAGE = "Malformed JSON payload in request body.";

/**
 * Transforms external, driver, or parser errors into unified AppError instances.
 */
export const transformError = (err: unknown): Error => {
  // 1. Duplicate entry / unique constraint violations (409 Conflict)
  if (isDuplicateKeyError(err)) {
    return new ConflictError(DUPLICATE_ENTRY_MESSAGE);
  }

  // 2. Foreign key constraint violations (409 Conflict)
  if (isForeignKeyConstraintError(err)) {
    return new ConflictError(FOREIGN_KEY_MESSAGE);
  }

  // 3. Zod validation errors (400 Bad Request)
  if (err instanceof ZodError) {
    return new ValidationError("Validation Failed", err.issues);
  }

  // 4. Malformed JSON parsing syntax errors (400 Bad Request)
  if (
    err instanceof SyntaxError &&
    (err.message.includes("JSON") ||
      err.message.includes("JSON Parse") ||
      err.message.includes("Unexpected token"))
  ) {
    return new ValidationError(MALFORMED_JSON_MESSAGE);
  }

  return err instanceof Error ? err : new Error(String(err));
};
