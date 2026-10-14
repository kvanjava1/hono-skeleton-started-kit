import type { Context } from "hono";
import { IndexPage } from "../../../../resources/views/example/Index.tsx";

/**
 * Controller responsible for loading and rendering web views
 * Following the MVC pattern to separate logic from routing and presentation.
 */

/**
 * Renders the Pure SSR Landing Page
 */
export const renderLandingPage = async (c: Context) => {
  const serverData = {
    appName: "Hono Skeleton Multi-DB",
    runtime: "Bun " + process.version,
    features: ["SQLite", "MySQL", "PostgreSQL", "Redis", "BullMQ"]
  };

  return c.html(await IndexPage({
    title: "Welcome to Hono Multi-DB",
    serverData
  }));
};
