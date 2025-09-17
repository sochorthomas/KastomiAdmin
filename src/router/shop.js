import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'ShopSales',
    component: () => import('@/views/shop/Sales.vue'),
    meta: { layout: 'shop' }
  },
  {
    path: '/product/:seo',
    name: 'ShopProduct',
    component: () => import('@/views/shop/ProductDetail.vue'),
    meta: { layout: 'shop' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'ShopNotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router