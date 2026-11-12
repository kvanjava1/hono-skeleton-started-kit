import { describe, it, expect } from "bun:test";
import { buildMysqlConfig } from "../../src/configs/mysql.config.ts";
import { buildPgConfig } from "../../src/configs/pg.config.ts";

describe("Database Connection Pool Configurations", () => {
  describe("MySQL Pool Configuration", () => {
    it("defaults to standard connection limit, queue limit, and idle timeout", () => {
      const config = buildMysqlConfig({});
      expect(config.mysql1.connectionLimit).toBe(10);
      expect(config.mysql1.queueLimit).toBe(0);
      expect(config.mysql1.waitForConnections).toBe(true);
      expect(config.mysql1.idleTimeout).toBe(30000);
    });

    it("parses custom MYSQL_CONNECTION_LIMIT_1 and MYSQL_IDLE_TIMEOUT_1", () => {
      const config = buildMysqlConfig({
        MYSQL_CONNECTION_LIMIT_1: "5",
        MYSQL_QUEUE_LIMIT_1: "50",
        MYSQL_IDLE_TIMEOUT_1: "15000",
      });
      expect(config.mysql1.connectionLimit).toBe(5);
      expect(config.mysql1.queueLimit).toBe(50);
      expect(config.mysql1.idleTimeout).toBe(15000);
    });

    it("falls back to legacy MYSQL_CONNECTION_LIMIT env key", () => {
      const config = buildMysqlConfig({
        MYSQL_CONNECTION_LIMIT: "25",
        MYSQL_IDLE_TIMEOUT: "60000",
      });
      expect(config.mysql1.connectionLimit).toBe(25);
      expect(config.mysql1.idleTimeout).toBe(60000);
    });
  });

  describe("PostgreSQL Pool Configuration", () => {
    it("defaults to standard max connections, idle timeout, and connect timeout", () => {
      const config = buildPgConfig({});
      expect(config.pg1.maxConnections).toBe(10);
      expect(config.pg1.idleTimeout).toBe(30);
      expect(config.pg1.connectTimeout).toBe(30);
    });

    it("parses custom PG_MAX_CONNECTIONS_1, PG_IDLE_TIMEOUT_1, and PG_CONNECT_TIMEOUT_1", () => {
      const config = buildPgConfig({
        PG_MAX_CONNECTIONS_1: "8",
        PG_IDLE_TIMEOUT_1: "45",
        PG_CONNECT_TIMEOUT_1: "15",
      });
      expect(config.pg1.maxConnections).toBe(8);
      expect(config.pg1.idleTimeout).toBe(45);
      expect(config.pg1.connectTimeout).toBe(15);
    });

    it("falls back to legacy PG_MAX_CONNECTIONS and PG_IDLE_TIMEOUT env keys", () => {
      const config = buildPgConfig({
        PG_MAX_CONNECTIONS: "20",
        PG_IDLE_TIMEOUT: "60",
      });
      expect(config.pg1.maxConnections).toBe(20);
      expect(config.pg1.idleTimeout).toBe(60);
    });
  });
});
