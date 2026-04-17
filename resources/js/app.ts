import { createApp, h } from 'vue'
import { createRouter, createWebHistory, RouterView } from 'vue-router'
import '../css/app.css'

import Home from './pages/Home.vue'
import Dashboard from './pages/Dashboard.vue'

// Ambil data dari "The Bridge" (Hono SSR)
const initialState = (window as any).__INITIAL_STATE__ || {};
console.log('📦 Data dari Hono SSR:', initialState);

// Menggunakan Render Function agar tidak butuh Runtime Compiler (lebih ringan & cepat)
const App = {
  render: () => h('div', [h(RouterView)])
}

const routes = [
  { path: '/', component: Home },
  { path: '/welcome', component: Home },
  { path: '/dashboard', component: Dashboard },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')
