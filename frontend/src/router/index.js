import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

  const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    props: true,
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue'),
    // 근데 난 코드 스플리팅 안 해도 될 듯....??
    props: true,
  },
  {
    path: '/earn',
    name: 'Earn',
    component: () => import(/* webpackChunkName: "about" */ '../views/Earn.vue'),
    props: true,
  },
  {
    path: '/verify',
    name: 'Verification',
    component: () => import(/* webpackChunkName: "about" */ '../views/Verification.vue'),
    props: true,
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
