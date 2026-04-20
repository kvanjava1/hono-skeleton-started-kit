import { createApp, h } from 'vue'
import { createRouter, createWebHistory, RouterView } from 'vue-router'
import '../../../css/app.css'

// Import local encapsulated pages
import Example2Home from './pages/Example2Home.vue'

/**
 * Vue SPA Application Shell
 */
const App = {
  render: () => h('div', { class: 'min-h-screen bg-slate-50' }, [h(RouterView)])
}

const routes = [
  {
    path: '/',
    component: Example2Home,
    name: 'example2-home'
  },
]

const router = createRouter({
  // IMPORTANT: The base path must match the Hono mount point
  history: createWebHistory('/example/example2'),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')
