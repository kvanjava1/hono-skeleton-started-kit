/** @jsxImportSource hono/jsx */
import type { Context } from "hono";
import { MainLayout } from "./layouts/MainLayout.tsx";

interface WelcomeProps {
  title?: string;
  initialData?: any;
}

/**
 * Welcome Component (The Bridge)
 * Sekarang menggunakan MainLayout yang reusable
 */
export const Welcome = async ({ title = "Hono + Vue Bridge", initialData = {} }: WelcomeProps) => {
  return (
    <MainLayout title={title} withVue={true}>
      {/* Transfer Server-side data to Client-side Vue */}
      <script dangerouslySetInnerHTML={{ 
        __html: `window.__INITIAL_STATE__ = ${JSON.stringify(initialData)};` 
      }} />

      {/* Vue Mount Point */}
      <div id="app"></div>
    </MainLayout>
  );
};

/**
 * Handler untuk rute / (Home)
 */
export const welcomeHandler = async (c: Context) => {
  const data = {
    serverTime: new Date().toISOString(),
    user: { name: "Melode", role: "Senior Developer" },
    message: "Halo! Ini adalah rute SSR yang memuat Vue."
  };
  
  return c.html(await Welcome({ 
    title: "Home Page | Hono-Vue Bridge", 
    initialData: data 
  }));
};
