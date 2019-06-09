import Vue from 'vue'
import Router from 'vue-router'
import Main from '@/view/main/index.vue'
import Rooms from '@/view/room/index.vue'
import Game from '@/view/game/index.vue'
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
          path: 'game',
          name: 'Game',
          component: Game
        }
      ]
    }
  ]
})
