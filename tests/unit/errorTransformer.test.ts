import { describe, it, expect } from "bun:test";
import { z } from "zod";
import { transformError } from "../../src/utils/errorTransformer.util.ts";
import { ConflictError, ValidationError } from "../../src/utils/errors.util.ts";

describe("errorTransformer", () => {
  describe("Database Duplicate Violations", () => {
    it("transforms MySQL duplicate error to ConflictError", () => {
      const err = { code: "ER_DUP_ENTRY", errno: 1062 };
      const res = transformError(err);
      expect(res).toBeInstanceOf(ConflictError);
      expect(res.message).toBe("The data you provided already exists.");
    });

    it("transforms Postgres duplicate error (23505) to ConflictError", () => {
      const err = { code: "23505" };
      const res = transformError(err);
      expect(res).toBeInstanceOf(ConflictError);
    });

    it("transforms Mongo duplicate error (11000) to ConflictError", () => {
      const err = { code: 11000 };
      const res = transformError(err);
      expect(res).toBeInstanceOf(ConflictError);
    });

    it("transforms SQLite unique violation to ConflictError", () => {
      const err = { code: "SQLITE_CONSTRAINT_UNIQUE" };
      const res = transformError(err);
      expect(res).toBeInstanceOf(ConflictError);
    });
  });

  describe("Database Foreign Key Violations", () => {
    it("transforms Postgres foreign key error (23503) to ConflictError", () => {
      const err = { code: "23503" };
      const res = transformError(err);
      expect(res).toBeInstanceOf(ConflictError);
      expect(res.message).toBe(
        "The requested operation violates a relation constraint.",
      );
    });

    it("transforms MySQL foreign key error (1451) to ConflictError", () => {
      const err = { errno: 1451, code: "ER_ROW_IS_REFERENCED" };
      const res = transformError(err);
      expect(res).toBeInstanceOf(ConflictError);
    });

    it("transforms SQLite foreign key error to ConflictError", () => {
      const err = { code: "SQLITE_CONSTRAINT_FOREIGNKEY" };
      const res = transformError(err);
      expect(res).toBeInstanceOf(ConflictError);
    });
  });

  describe("Validation & Parser Errors", () => {
    it("transforms Zod validation error to ValidationError", () => {
      const schema = z.object({ age: z.number() });
      const parseResult = schema.safeParse({ age: "invalid" });
      if (!parseResult.success) {
        const res = transformError(parseResult.error);
        expect(res).toBeInstanceOf(ValidationError);
        expect(res.message).toBe("Validation Failed");
      }
    });

    it("transforms JSON syntax error to ValidationError (400)", () => {
      let syntaxErr: SyntaxError | null = null;
      try {
        JSON.parse("{ bad json");
      } catch (e: any) {
        syntaxErr = e;
      }
      expect(syntaxErr).not.toBeNull();
      const res = transformError(syntaxErr);
      expect(res).toBeInstanceOf(ValidationError);
      expect(res.message).toBe("Malformed JSON payload in request body.");
    });

    it("passes standard Error through unchanged", () => {
      const standardErr = new Error("something went wrong");
      const res = transformError(standardErr);
      expect(res).toBe(standardErr);
    });
  });
});
