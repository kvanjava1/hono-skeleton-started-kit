import { createApp, h } from 'vue'
import { createRouter, createWebHistory, RouterView } from 'vue-router'
import '../../../css/app.css'

// Import local encapsulated pages
import Example1Home from './pages/Example1Home.vue'

/**
 * Vue SPA Application Shell
 */
const App = {
  render: () => h('div', { class: 'min-h-screen bg-slate-50' }, [h(RouterView)])
}

const routes = [
  {
    path: '/',
    component: Example1Home,
    name: 'example1-home'
  },
]

const router = createRouter({
  // IMPORTANT: The base path must match the Hono mount point
  history: createWebHistory('/example/example1'),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')
