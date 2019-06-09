<template>
  <div class="main">
    <div class="rooms">
      <div
        v-for="room in rooms"
        :key="room.roomId"
        class="room"
        :style="{backgroundColor: (room.members.length === 4 || room.isStart) ? 'red' : 'skyblue'}"
        @click="handleJoin(room.roomId)"
      >{{room.name}}</div>
      <div class="room" @click="nameModal = true" style="background-color:skyblue">
        <Icon type="md-add" size="large"/>
      </div>
      <div class="room" @click="getRooms()" style="background-color:skyblue">
        <Icon type="md-refresh" size="large"/>
      </div>
    </div>
    <Modal v-model="nameModal" width="360" :mask-closable="false">
      <p slot="header" style="color:#f60;text-align:center">请输入房间名</p>
      <div style="text-align:center">
        <Input v-model="roomName"/>
      </div>
      <div slot="footer">
        <Button type="primary" size="large" long @click="handleAdd">确定</Button>
      </div>
    </Modal>
  </div>
</template>
<script>
import API from '@/api'
import UCommon from '@/util/common'
export default {
  name: 'room',
  props: [],
  components: {},
  data () {
    return {
      rooms: [],
      nameModal: false,
      roomName: ''
    }
  },
  created () {},
  mounted () {
    this.getRooms()
  },
  methods: {
    async getRooms () {
      const result = await API.getRooms()
      this.rooms = result
    },
    async handleJoin (roomId) {
      this.$router.push({name: 'Game', query: {roomId}})
    },
    async handleAdd () {
      const name = this.roomName.trim()
      if (name.length === 0) {
        this.$Message.error('房间名不能是空')
      } else {
        const userMsg = UCommon.getUserMsg()
        const result = await API.addRooms({
          ...userMsg,
          roomName: name
        })
        if (result.done) {
          this.$Message.info('添加成功')
          this.getRooms()
        } else {
          this.$Message.error('添加失败')
        }
        this.nameModal = false
      }
    }
  },
  computed: {
  }
}
</script>
<style scoped>
.main {
}
.rooms {
  display: flex;
  flex-direction: flex-start;
  align-items: center;
  flex-wrap: wrap;
}
.room {
  width: 100px;
  height: 100px;
  margin-left: 10px;
  margin-top: 10px;
  border-radius: 5px;
  cursor: pointer;
  text-align: center;
  line-height: 100px;
  color: blue;
}
</style>
