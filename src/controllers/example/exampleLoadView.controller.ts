import type { Context } from "hono";
import { IndexPage } from "../../../resources/views/example/Index.tsx";
import { IndexVue } from "../../../resources/views/example/IndexVue.tsx";

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

/**
 * Renders the Example1 Vue SPA
 */
export const renderExample1 = async (c: Context) => {
  const data = {
    module: "Example 1",
    stats: { users: 100, status: "Active" }
  };

  return c.html(await IndexVue({
    title: "Example 1 Console",
    initialState: data,
    entryPoint: "js/apps/example1/main.ts"
  }));
};

/**
 * Renders the Example2 Vue SPA
 */
export const renderExample2 = async (c: Context) => {
  const data = {
    module: "Example 2",
    config: { mode: "standalone" }
  };

  return c.html(await IndexVue({
    title: "Example 2 Console",
    initialState: data,
    entryPoint: "js/apps/example2/main.ts"
  }));
};
