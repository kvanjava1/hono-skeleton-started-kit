import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { getViteDevServer } from "../../src/utils/vite.util.ts";

describe("Vite Utilities", () => {
  const originalUrl = process.env.VITE_DEV_SERVER_URL;

  afterEach(() => {
    if (originalUrl !== undefined) {
      process.env.VITE_DEV_SERVER_URL = originalUrl;
    } else {
      delete process.env.VITE_DEV_SERVER_URL;
    }
  });

  it("getViteDevServer defaults to http://localhost:5173/build", () => {
    delete process.env.VITE_DEV_SERVER_URL;
    expect(getViteDevServer()).toBe("http://localhost:5173/build");
  });

  it("getViteDevServer appends /build when missing", () => {
    process.env.VITE_DEV_SERVER_URL = "http://localhost:5173";
    expect(getViteDevServer()).toBe("http://localhost:5173/build");

    process.env.VITE_DEV_SERVER_URL = "http://localhost:5173/";
    expect(getViteDevServer()).toBe("http://localhost:5173/build");
  });

  it("getViteDevServer preserves /build when already provided", () => {
    process.env.VITE_DEV_SERVER_URL = "http://localhost:5173/build";
    expect(getViteDevServer()).toBe("http://localhost:5173/build");

    process.env.VITE_DEV_SERVER_URL = "http://localhost:5173/build/";
    expect(getViteDevServer()).toBe("http://localhost:5173/build");
  });
});
