<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white font-sans">
    <div class="p-8 text-center">
      <h1 class="text-4xl font-black mb-4 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
        Secure Dashboard
      </h1>
      <p class="text-slate-400 mb-8 max-w-lg mx-auto leading-relaxed">
        This is a secondary page controlled by Vue-Router. It acts like a Single Page Application without any page reload.
      </p>
      
      <router-link to="/" class="px-6 py-3 bg-white text-slate-900 font-bold rounded-lg shadow-lg hover:scale-105 transition-transform duration-200">
        Back to Home
      </router-link>
    </div>
  </div>
</template>
