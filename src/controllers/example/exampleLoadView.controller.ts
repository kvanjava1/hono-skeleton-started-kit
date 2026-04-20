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
 * Renders the Vue SPA Hybrid Bridge Shell
 */
export const renderDashboard = async (c: Context) => {
  // Simulate fetching data from a service or DB
  const serverData = {
    user: {
      name: "Melode",
      role: "Admin",
      lastLogin: new Date().toLocaleDateString()
    },
    system: {
      version: "1.0.0-modular",
      node: process.version
    },
    timestamp: new Date().toISOString()
  };

  return c.html(await IndexVue({
    title: "Project Dashboard (Modular View Controller)",
    initialState: serverData
  }));
};
