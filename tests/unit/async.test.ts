import { describe, expect, test } from "bun:test";
import { withTimeout } from "../../src/utils/async.util.ts";

describe("withTimeout", () => {
  test("resolves when the promise settles in time", async () => {
    const result = await withTimeout(Promise.resolve("ok"), 100);
    expect(result).toBe("ok");
  });

  test("rejects when the promise exceeds the timeout", async () => {
    const never = new Promise<string>(() => {});
    await expect(withTimeout(never, 20)).rejects.toThrow("timeout after 20ms");
  });

  test("propagates rejection from the promise", async () => {
    await expect(
      withTimeout(Promise.reject(new Error("boom")), 100),
    ).rejects.toThrow("boom");
  });
});
