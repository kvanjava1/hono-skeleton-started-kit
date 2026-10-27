import { describe, it, expect } from "bun:test";
import { buildRedisConfig } from "../../src/configs/redis.config.ts";

describe("Redis Configuration", () => {
  it("defaults to db 0, port 6379, tls false, and undefined password", () => {
    const config = buildRedisConfig({});
    expect(config.redis1.host).toBe("localhost");
    expect(config.redis1.port).toBe(6379);
    expect(config.redis1.db).toBe(0);
    expect(config.redis1.password).toBeUndefined();
    expect(config.redis1.tls).toBe(false);
  });

  it("parses custom REDIS_DB_1, REDIS_PASSWORD_1, and REDIS_TLS_1", () => {
    const config = buildRedisConfig({
      REDIS_HOST_1: "redis.internal",
      REDIS_PORT_1: "6380",
      REDIS_DB_1: "3",
      REDIS_PASSWORD_1: "secret123",
      REDIS_TLS_1: "true",
    });
    expect(config.redis1.host).toBe("redis.internal");
    expect(config.redis1.port).toBe(6380);
    expect(config.redis1.db).toBe(3);
    expect(config.redis1.password).toBe("secret123");
    expect(config.redis1.tls).toBe(true);
  });

  it("falls back to legacy REDIS_DB and REDIS_PASSWORD env keys", () => {
    const config = buildRedisConfig({
      REDIS_HOST: "legacy-redis",
      REDIS_PORT: "6379",
      REDIS_DB: "5",
      REDIS_PASSWORD: "legacy-secret",
      REDIS_TLS: "1",
    });
    expect(config.redis1.host).toBe("legacy-redis");
    expect(config.redis1.db).toBe(5);
    expect(config.redis1.password).toBe("legacy-secret");
    expect(config.redis1.tls).toBe(true);
  });
});
