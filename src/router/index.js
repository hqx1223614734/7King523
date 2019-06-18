import Vue from 'vue'
import Router from 'vue-router'
import Main from '@/view/main/index.vue'
import Rooms from '@/view/room/index.vue'
import King523 from '@/view/game/7king523.vue'
import Holdem from '@/view/game/holdem.vue'
Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Main',
      component: Main,
      redirect: '/rooms',
      children: [
        {
          path: 'rooms',
          name: 'Rooms',
          component: Rooms
        },
        {
          path: '1',
          name: '1',
          component: King523
        },
        {
          path: '2',
          name: '2',
          component: Holdem
        }
      ]
    }
  ]
})
