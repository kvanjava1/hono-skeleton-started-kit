/** @jsxImportSource hono/jsx */
import type { Context } from "hono";
import { MainLayout } from "./layouts/MainLayout.tsx";

export const AboutPage = () => {
  return (
    <MainLayout title="Showcase Tailwind v4 | SSR Mode" withVue={false}>
      <div class="relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-indigo-50/50 to-transparent -z-10"></div>
        <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/30 blur-[120px] rounded-full -z-10"></div>
        <div class="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-200/30 blur-[100px] rounded-full -z-10"></div>

        <main class="max-w-7xl mx-auto px-6 pt-24 pb-32">
          {/* Header Section */}
          <div class="max-w-3xl mb-20">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-xl shadow-indigo-200">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-300 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-100"></span>
              </span>
              Hono SSR + Tailwind v4
            </div>
            
            <h1 class="text-6xl md:text-8xl font-black text-slate-900 leading-[0.9] mb-8 tracking-tighter">
              Bukan Sekadar <br />
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">Halaman Statis.</span>
            </h1>
            
            <p class="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed max-w-2xl">
              Halaman ini dirender 100% di server (SSR). Tanpa runtime JavaScript yang berat, memberikan skor performa sempurna tanpa mengorbankan estetika.
            </p>
          </div>

          {/* Features Grid */}
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div class="group relative p-10 bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
              <div class="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <svg class="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <div class="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <h3 class="text-2xl font-bold text-slate-900 mb-4">Ultra Fast Loading</h3>
              <p class="text-slate-500 leading-relaxed font-medium">
                Karena tidak ada bundle Vue yang dimuat, halaman ini langsung interaktif dalam sekejap. Sempurna untuk SEO.
              </p>
            </div>

            {/* Card 2 */}
            <div class="group relative p-10 bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
              <div class="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <svg class="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-3M9.707 3.293l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L10.586 7H7a2 2 0 00-2 2v12"/></svg>
              </div>
              <div class="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-500">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-3M9.707 3.293l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L10.586 7H7a2 2 0 00-2 2v12"/></svg>
              </div>
              <h3 class="text-2xl font-bold text-slate-900 mb-4">Tailwind v4 Power</h3>
              <p class="text-slate-500 leading-relaxed font-medium">
                Memanfaatkan engine CSS terbaru yang lebih ringan dan fitur variabel CSS asli untuk kustomisasi tanpa batas.
              </p>
            </div>

            {/* Card 3 */}
            <div class="group relative p-10 bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
              <div class="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <svg class="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div class="w-14 h-14 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-pink-600 group-hover:text-white transition-colors duration-500">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              </div>
              <h3 class="text-2xl font-bold text-slate-900 mb-4">Type-Safe Views</h3>
              <p class="text-slate-500 leading-relaxed font-medium">
                Ditulis dengan Hono JSX + TypeScript. Setiap tag dan atribut divalidasi saat kompilasi.
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div class="mt-20 flex flex-col md:flex-row items-center gap-6 p-12 bg-slate-900 rounded-[50px] shadow-3xl">
            <div class="flex-1 text-center md:text-left">
              <h2 class="text-3xl font-bold text-white mb-2">Ingin mencoba interaktivitas?</h2>
              <p class="text-slate-400 font-medium">Klik tombol di samping untuk kembali ke mode Vue Bridge.</p>
            </div>
            <div class="flex gap-4">
              <a href="/" class="px-10 py-5 bg-indigo-600 text-white font-black rounded-3xl hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-indigo-500/30">
                Dashboard Vue
              </a>
              <button onclick="alert('Halo dari Vanilla JS!')" class="px-10 py-5 bg-slate-800 text-white font-black rounded-3xl hover:bg-slate-700 transition-all">
                Test JS
              </button>
            </div>
          </div>
        </main>
      </div>
    </MainLayout>
  );
};

export const aboutHandler = async (c: Context) => {
  return c.html(await AboutPage());
};
