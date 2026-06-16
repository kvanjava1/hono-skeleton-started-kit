import { describe, expect, test } from "bun:test";
import {
  AppError,
  ValidationError,
  NotFoundError,
  DatabaseError,
  ConflictError,
  DuplicateOrderError,
  UnauthorizedError,
  InvalidTokenError,
  ForbiddenError,
  RateLimitError,
  ScrapingError,
} from "../../src/utils/errors.util.ts";
import { HTTP_STATUS } from "../../src/configs/constants.ts";

describe("AppError", () => {
  test("creates with default values", () => {
    const err = new AppError("test error");
    expect(err.message).toBe("test error");
    expect(err.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(err.isOperational).toBe(true);
    expect(err.data).toBeNull();
    expect(err.name).toBe("AppError");
  });

  test("accepts custom status code", () => {
    const err = new AppError("custom", 418);
    expect(err.statusCode).toBe(418);
  });

  test("accepts custom data", () => {
    const data = { key: "value" };
    const err = new AppError("with data", 400, true, data);
    expect(err.data).toEqual(data);
  });
});

describe("ValidationError", () => {
  test("default message and status", () => {
    const err = new ValidationError();
    expect(err.message).toBe("Validation error");
    expect(err.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(err.name).toBe("ValidationError");
  });

  test("accepts custom message and details", () => {
    const err = new ValidationError("bad input", { field: "email" });
    expect(err.message).toBe("bad input");
    expect(err.data).toEqual({ field: "email" });
  });
});

describe("NotFoundError", () => {
  test("default message and status", () => {
    const err = new NotFoundError();
    expect(err.message).toBe("Resource not found");
    expect(err.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
  });
});

describe("DatabaseError", () => {
  test("default message and status", () => {
    const err = new DatabaseError();
    expect(err.message).toBe("Database error");
    expect(err.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  });
});

describe("ConflictError", () => {
  test("default status 409", () => {
    const err = new ConflictError("duplicate");
    expect(err.message).toBe("duplicate");
    expect(err.statusCode).toBe(409);
  });
});

describe("DuplicateOrderError", () => {
  test("formats message with orderId", () => {
    const err = new DuplicateOrderError("order-123");
    expect(err.message).toBe("Order with ID order-123 has already been processed");
    expect(err.statusCode).toBe(409);
  });
});

describe("UnauthorizedError", () => {
  test("default message and status", () => {
    const err = new UnauthorizedError();
    expect(err.message).toBe("Unauthorized");
    expect(err.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
  });
});

describe("InvalidTokenError", () => {
  test("default message and status", () => {
    const err = new InvalidTokenError();
    expect(err.message).toBe("Invalid or expired token signature");
    expect(err.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
  });
});

describe("ForbiddenError", () => {
  test("default message and status", () => {
    const err = new ForbiddenError();
    expect(err.message).toBe("Forbidden");
    expect(err.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
  });
});

describe("RateLimitError", () => {
  test("default message and status 429", () => {
    const err = new RateLimitError();
    expect(err.message).toBe("Too many requests, please try again later");
    expect(err.statusCode).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
  });
});

describe("ScrapingError", () => {
  test("default message and status", () => {
    const err = new ScrapingError();
    expect(err.message).toBe("Failed to extract data from target source");
    expect(err.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  });
});
