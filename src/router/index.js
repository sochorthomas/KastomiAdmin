import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Import views
import Login from '@/views/Login.vue'
import Dashboard from '@/views/Dashboard.vue'
import Orders from '@/views/Orders.vue'
import Products from '@/views/Products.vue'
import Dresy from '@/views/Dresy.vue'
import NotFound from '@/views/NotFound.vue'

const routes = [
  {
    path: '/prihlaseni',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/login',  // Keep old path for backward compatibility
    redirect: '/prihlaseni'
  },
  {
    path: '/',
    redirect: '/prehled'
  },
  {
    path: '/dashboard',  // Keep old path for backward compatibility
    redirect: '/prehled'
  },
  {
    path: '/prehled',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true, layout: 'app' }
  },
  {
    path: '/orders',  // Keep old path for backward compatibility
    redirect: '/objednavky'
  },
  {
    path: '/objednavky',
    name: 'Orders',
    component: Orders,
    meta: { requiresAuth: true, layout: 'app' }
  },
  {
    path: '/sales-offers',  // Keep old path for backward compatibility
    redirect: '/produkty'
  },
  {
    path: '/produkty',
    name: 'Products',
    component: Products,
    meta: { requiresAuth: true, layout: 'app' }
  },
  {
    path: '/dresy',
    name: 'Dresy',
    component: Dresy,
    meta: { requiresAuth: true, layout: 'app' }
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Wait for auth to initialize
  while (authStore.loading) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  const requiresAuth = to.meta.requiresAuth !== false
  const isAuthenticated = authStore.isAuthenticated
  
  if (requiresAuth && !isAuthenticated) {
    next('/prihlaseni')
  } else if ((to.path === '/prihlaseni' || to.path === '/login') && isAuthenticated) {
    next('/prehled')
  } else {
    // For authenticated routes, wait for sales channel to load
    if (requiresAuth && isAuthenticated && !authStore.salesChannelLoaded) {
      // Wait for sales channel data with timeout
      const timeout = 5000 // 5 seconds timeout
      const startTime = Date.now()
      
      while (!authStore.salesChannelLoaded && (Date.now() - startTime) < timeout) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // Log warning if timeout reached
      if (!authStore.salesChannelLoaded) {
        console.warn('Sales channel data loading timed out')
      }
    }
    next()
  }
})

export default router