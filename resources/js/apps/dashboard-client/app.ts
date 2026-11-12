/// <reference types="vite/client" />
import { createInertiaApp } from "@inertiajs/svelte";
import { mount, type Component } from "svelte";

/**
 * Bootstrap for the `dashboard-client` external client portal app.
 * Completely isolated from `dashboard-admin`.
 */
const pages = import.meta.glob<{ default: Component }>(
  "./pages/**/*.svelte",
);

createInertiaApp({
  resolve: async (name: string) => {
    // Strip the `<appName>/` prefix (e.g. `dashboard-client/Client/Dashboard` -> `Client/Dashboard`)
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
