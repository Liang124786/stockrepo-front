// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('@/pages/HomePage.vue') },
  { path: '/login', name: 'login', component: () => import('@/pages/LoginPage.vue') },
  { path: '/register', name: 'register', component: () => import('@/pages/RegisterPage.vue') },
  {
    path: '/sector/:sector',
    name: 'sector',
    component: () => import('@/views/SectorPage.vue'),
  },
  {
    path: '/stocks/:market/:symbol',
    name: 'stock',
    component: () => import('@/pages/StockPage.vue'),
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/pages/ProfilePage.vue'),
  },
  {
    path: '/watchlist',
    name: 'watchlist',
    component: () => import('@/pages/WatchlistPage.vue'),
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/pages/AdminPage.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
router.beforeEach((to) => {
  if (to.path !== '/admin') return true

  const token = localStorage.getItem('token')
  if (!token) return '/login'

  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (payload?.role !== 'admin') return '/'
    return true
  } catch {
    return '/login'
  }
})

export default router
