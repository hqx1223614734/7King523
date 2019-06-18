<template>
  <div class="main">
    <div class="rooms">
      <div
        v-for="room in rooms"
        :key="room.roomId"
        class="room"
        :style="{backgroundColor: room.isStart ? 'red' : 'skyblue'}"
        @click="handleJoin(room.isStart, room.roomId, room.type)"
      >
        <div class="room-msg">
          <p class="room-name">{{room.name}}</p>
          <p class="game-name">{{gameTypeMap[room.type] && gameTypeMap[room.type].name}}</p>
        </div>
      </div>
      <div class="room-tool" @click="nameModal = true" style="background-color:skyblue">
        <Icon type="md-add" size="large"/>
      </div>
      <div class="room-tool" @click="getRooms()" style="background-color:skyblue">
        <Icon type="md-refresh" size="large"/>
      </div>
    </div>
    <Modal v-model="nameModal" width="360" :mask-closable="false">
      <p slot="header" style="color:#f60;text-align:center">请输入房间名</p>
      <div class="game-type">
        <RadioGroup v-model="gameType" vertical>
          <Radio v-for="item in gameTypeList" :key="item.type" :label="item.type">
            <span>{{item.name}}</span>
          </Radio>
        </RadioGroup>
      </div>
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
      roomName: '',
      gameTypeList: [],
      gameType: ''
    }
  },
  created () {},
  mounted () {
    this.getGameType()
    this.getRooms()
  },
  methods: {
    async getGameType () {
      const result = await API.gameType()
      this.gameTypeList = result
      this.gameType = result[0].type
    },
    async getRooms () {
      const result = await API.getRooms()
      this.rooms = result
    },
    async handleJoin (isStart, roomId, type) {
      if (isStart) {
        this.$Message.info('该房间已开始游戏')
      } else {
        this.$router.push({name: type, query: {roomId}})
      }
    },
    async handleAdd () {
      const name = this.roomName.trim()
      if (name.length === 0) {
        this.$Message.error('房间名不能是空')
      } else {
        const userMsg = UCommon.getUserMsg()
        const result = await API.addRooms({
          ...userMsg,
          roomName: name,
          type: this.gameType
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
    gameTypeMap () {
      let map = {}
      this.gameTypeList.forEach(item => {
        map[item.type] = item
      })
      return map
    }
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
.room-tool {
  position: relative;
  width: 100px;
  height: 100px;
  margin-left: 10px;
  margin-top: 10px;
  border-radius: 5px;
  cursor: pointer;
  color: blue;
  text-align: center;
  line-height: 100px;
}

.room {
  position: relative;
  width: 100px;
  height: 100px;
  margin-left: 10px;
  margin-top: 10px;
  border-radius: 5px;
  cursor: pointer;
  color: blue;
}
.room-msg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.room-name {
  font-size: 20px;
}
.game-name {
  color: black;
  font-size: 12px;
}
</style>
