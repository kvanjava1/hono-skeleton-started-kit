/// <reference types="vite/client" />
import { createInertiaApp } from "@inertiajs/svelte";
import { mount, type Component } from "svelte";

/**
 * Bootstrap for the `example1` client app.
 *
 * Each client app under `resources/js/apps/<appName>/` owns its own entry
 * file (`app.ts`) and pages. To create a new client app: add a new folder
 * with an `app.ts` (this file can be copied as-is) and register its entry
 * in `vite.config.ts` rollupOptions.input.
 *
 * The server sends app-namespaced page names (`<appName>/<PagePath>`,
 * e.g. `example1/Cruds/Index`); the app prefix is stripped here so the
 * resolve logic is identical for every app.
 */
const pages = import.meta.glob<{ default: Component }>(
  "./pages/**/*.svelte",
);

createInertiaApp({
  resolve: async (name: string) => {
    const pagePath = name.split("/").slice(1).join("/");
    if (!pagePath) {
      throw new Error(
        `Invalid Inertia page name "${name}". Expected "<appName>/<PagePath>".`,
      );
    }

    const loader = pages[`./pages/${pagePath}.svelte`];
    if (!loader) {
      throw new Error(`Inertia page not found: ${name}`);
    }
    return await loader();
  },
  setup({ el, App, props }) {
    mount(App, { target: el as HTMLElement, props });
  },
});
