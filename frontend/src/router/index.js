import Vue from 'vue'
import VueRouter from 'vue-router'
import index from '../views/index.vue'
import myPage from '../views/myPage.vue'
import reward from '../views/reward.vue'
import qrCode from '../views/qrCode.vue'

Vue.use(VueRouter)

  const routes = [
  {
    path: '/',
    name: 'index',
    component: index
  },
  {
    path: '/myPage',
    name: 'myPage',
    component: myPage
  },
  {
    path: '/reward',
    name: 'reward',
    component: reward
  },
  {
    path: '/qrCode',
    name: 'qrCode',
    component: qrCode
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
