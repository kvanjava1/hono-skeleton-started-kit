/** @jsxImportSource hono/jsx */
import type { Context } from "hono";
import { Layout } from "./Layout.tsx";

interface IndexVueProps {
  title?: string;
  initialState?: any;
}

/**
 * IndexVue Component (The Bridge)
 * Serves as the "Shell" for the Vue SPA application
 */
export const IndexVue = async ({ title = "Dashboard | Vue SPA", initialState = {} }: IndexVueProps) => {
  return (
    <Layout title={title} withVue={true}>
      {/* Hydration: Passing server-side data to the client-side window object */}
      <script dangerouslySetInnerHTML={{ 
        __html: `window.__INITIAL_STATE__ = ${JSON.stringify(initialState)};` 
      }} />

      {/* Vue.js mounting point */}
      <div id="app"></div>
    </Layout>
  );
};

/**
 * Default handler for the Vue Index route
 */
export const indexVueHandler = async (c: Context) => {
  const serverData = {
    user: { name: "Melode", role: "Admin" },
    timestamp: new Date().toISOString(),
    env: "development"
  };
  
  return c.html(await IndexVue({ 
    title: "Project Dashboard", 
    initialState: serverData 
  }));
};
