import Cookies from 'js-cookie';
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import LocalizeView from '../views/LocalizeView.vue';
import GenerateView from '../views/GenerateView.vue';
import SignInView from '../views/SignInView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/signin',
    name: 'signin',
    component: SignInView,
  },
  {
    path: '/',
    redirect: '/localize',
  },
  {
    path: '/localize',
    name: 'localize',
    component: LocalizeView,
    meta: { requiresAuth: true },
  },
  {
    path: '/generate',
    name: 'generate',
    component: GenerateView,
    meta: { requiresAuth: true },
  },
  {
    path: '/jobs',
    name: 'jobs',
    component: () => import('../views/JobsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/validate',
    name: 'validate',
    component: () => import('../views/ValidateView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/classify',
    name: 'classify',
    component: () => import('../views/ClassifyView.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = !!Cookies.get('google_token');

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'signin' });
  } else {
    next();
  }
});

export default router;
