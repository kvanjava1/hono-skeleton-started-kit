import { createApp, h } from 'vue'
import { createRouter, createWebHistory, RouterView } from 'vue-router'
import '../css/app.css'

// Import new modular components
import DashboardHome from './pages/DashboardHome.vue'
import UserProfile from './pages/UserProfile.vue'

/**
 * Vue SPA Application Shell
 * 
 * We use createWebHistory('/dashboard') to mount the entire Vue app 
 * under the /dashboard sub-path of our Hono server.
 */
const App = {
  render: () => h('div', { class: 'min-h-screen bg-slate-50' }, [h(RouterView)])
}

const routes = [
  {
    path: '/',
    component: DashboardHome,
    name: 'dashboard-home'
  },
  {
    path: '/user',
    component: UserProfile,
    name: 'user-profile'
  },
]

const router = createRouter({
  // IMPORTANT: The base path must match the Hono mount point
  history: createWebHistory('/example/dashboard'),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')
