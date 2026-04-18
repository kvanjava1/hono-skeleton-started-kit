/** @jsxImportSource hono/jsx */
import type { Context } from "hono";
import { Layout } from "./Layout.tsx";

/**
 * Index Component (Pure SSR)
 * Example of a landing page 100% managed by the server
 */
export const IndexPage = () => {
  return (
    <Layout title="Welcome | Pure SSR Mode" withVue={false}>
      <main class="min-h-screen flex flex-col items-center justify-center p-6 bg-radial-gradient">
        <div class="max-w-4xl w-full text-center">
          <div class="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-widest text-indigo-600 uppercase bg-indigo-50 rounded-full">
            Hono SSR Mode Active
          </div>
          
          <h1 class="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight">
            Performance Without <br />
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Compromise.</span>
          </h1>
          
          <p class="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            This is an example of an Index page using 100% Server-side Rendering. 
            Fast, SEO-friendly, and ultra-lightweight with zero client-side JavaScript overhead.
          </p>
          
          <div class="flex flex-wrap items-center justify-center gap-4">
            <a href="/dashboard" class="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-200">
              Go to Vue Dashboard
            </a>
            <a href="/about" class="px-8 py-4 bg-white text-slate-900 font-bold border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all">
              Learn More
            </a>
          </div>
        </div>
      </main>
    </Layout>
  );
};

/**
 * Handler for the SSR Index route
 */
export const indexHandler = async (c: Context) => {
  return c.html(<IndexPage />);
};
