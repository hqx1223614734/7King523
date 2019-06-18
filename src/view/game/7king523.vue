<template>
  <div class="main">
    <div
      class="top area"
      :class="{currentPlayer: (members[1] && members[1].uid === currentPlayer) ? true : false}"
    >
      <span class="name">{{members[1] ? members[1].name : '无'}}</span>
      <div class="cards" v-if="members[1]">
        <div
          class="card"
          v-for="(item) in handCards[members[1].uid]"
          :key="item.id"
        >
            <span class="card-label">？</span>
    </div>
      </div>
    </div>
    <div
      class="right area"
      :class="{currentPlayer: (members[0] && members[0].uid === currentPlayer) ? true : false}"
    >
      <span class="name">{{members[0] ? members[0].name : '无'}}</span>
      <div class="remainHandCards" v-if="members[0]">
        <div
          class="card"
          v-for="(item) in handCards[members[0].uid]"
          :key="item.id"
        >
            <span class="card-label">？</span>
    </div>
      </div>
    </div>
    <div
      class="left area"
      :class="{currentPlayer: (members[2] && members[2].uid === currentPlayer) ? true : false}"
    >
      <span class="name">{{members[2] ? members[2].name : '无'}}</span>
      <div class="remainHandCards" v-if="members[2]">
        <div
          class="card"
          v-for="(item) in handCards[members[2].uid]"
          :key="item.id"
        >
            <span class="card-label">？</span>
    </div>
      </div>
    </div>
    <div class="center area">
      <div class="remainCards">
        <span>剩余：</span>
        <span style="color:pink">{{remainLength}}</span>
        <span>张</span>
      </div>
      <div class="cardGroup" v-for="(cardGroup, index) in currentCards" :key="index">
        <div
          class="card"
          v-for="(item) in cardGroup"
          :key="item.id"
        >
            <span
              class="card-color"
              :style="{color: (item.color === '♥' || item.color === '♦' || item.color === '\u265B') ? 'red' : 'black'}"
            >{{item.color}}</span>&nbsp;
            <span class="card-label">{{item.label}}</span>
        </div>
      </div>
    </div>
    <div
      class="bottom area"
      :class="{currentPlayer: (userMsg.uid === currentPlayer) ? true : false}"
    >
      <div class="tools">
        <Tooltip content="开始游戏" placement="top" transfer v-show="gameOver && canOpen && isOwner">
          <Icon type="md-cube" class="tool hoverToRed" @click="handleStartGame" size="20"/>
        </Tooltip>
        <Tooltip
          content="出牌"
          placement="top"
          transfer
          v-show="userMsg.uid === currentPlayer && selectedCards.length !== 0 && !gameOver"
        >
          <Icon type="ios-share" size="20" class="tool hoverToRed" @click="handlePlayCard"/>
        </Tooltip>
        <Tooltip
          content="跳过"
          placement="top"
          transfer
          v-show="!gameOver && userMsg.uid === currentPlayer && currentCards.length !== 0"
        >
          <Icon type="md-fastforward" size="20" class="tool hoverToRed" @click="handleSkip"/>
        </Tooltip>
        <Icon class="tool hoverToRed" type="md-log-out" size="20" @click="handleLeave"/>
      </div>
      <div class="cards">
        <div
          class="card"
          v-for="(item, index) in cards"
          :key="index"
          @click="cards[index].selected = !cards[index].selected"
          :style="{transform: item.selected ? 'translateY(-10px)' : 'translateY(0px)'}"
        >
            <span
              class="card-color"
              :style="{color: (item.color === '♥' || item.color === '♦' || item.color === '\u265B') ? 'red' : 'black'}"
            >{{item.color}}</span>&nbsp;
            <span class="card-label">{{item.label}}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import UCommon from '@/util/common'
import io from 'socket.io-client'
export default {
  name: 'Game',
  props: [],
  components: {},
  data () {
    return {
      remainLength: '',
      handCards: {},
      currentCards: [],
      cards: [],
      members: [],
      userMsg: {},
      roomId: '',
      server: null,
      isOwner: false,
      currentPlayer: '',
      gameOver: true
    }
  },
  created () {},
  mounted () {
    this.userMsg = UCommon.getUserMsg()
    this.roomId = this.$route.query.roomId
    this.initIo()
  },
  methods: {
    initIo () {
      const userMsg = this.userMsg
      if (userMsg === null) return
      const server = io('http://140.143.141.240:3000', {
        query: {
          uid: userMsg.uid,
          name: userMsg.name
        }
      })
      server.on('connect', () => {
        server.on('updateRoomMembers', this.onUpdateRoomMembers)
        server.on('message', this.onMessage)
        server.on('updateOwner', this.onUpdateOwner)
        server.on('dealCards', this.onDealCards)
        server.on('currentPlayer', this.onCurrentPlayer)
        server.on('handCards', this.onHandCards)
        server.on('playCardsResult', this.onPlayCardsResult)
        server.on('currentCards', this.onCurrentCards)
        server.on('remainCards', this.onRemainCards)
        server.on('gameOver', this.onGameOver)
        server.emit('joinRooms', {
          uid: userMsg.uid,
          name: userMsg.name,
          roomId: this.roomId
        })
      })
      this.server = server
    },
    onGameOver (status) {
      this.gameOver = status
      if (status) {
        this.$Message.info('游戏结束')
      }
    },
    onRemainCards (cards) {
      this.remainLength = cards.length
    },
    onCurrentCards (cards) {
      this.currentCards = cards
    },
    onHandCards (handCards) {
      const uid = this.userMsg.uid
      this.handCards = handCards
      this.cards = handCards[uid] ? handCards[uid].map(card => ({...card, selected: false})) : []
    },
    onCurrentPlayer (uid) {
      this.currentPlayer = uid
    },
    onDealCards (cards) {
      this.cards = [...this.cards, ...cards].map(card => ({...card, selected: false}))
    },
    onUpdateRoomMembers (data) {
      const uid = this.userMsg.uid
      let index = data.findIndex(item => item.uid === uid)
      let members = []
      if (data.length === 2) {
        members = [data[(index + 1) % 2]]
      } else if (data.length === 3) {
        members = [data[(index + 1) % 3], data[(index + 2) % 3]]
      } else if (data.length === 4) {
        members = [data[(index + 1) % 4], data[(index + 2) % 4], data[(index + 3) % 4]]
      }
      this.members = members
    },
    onMessage (data) {
      const func = data.type
      if (typeof this.$Message[func] === 'function') {
        this.$Message[func](data.msg)
      }
    },
    onUpdateOwner (data) {
      this.isOwner = true
      this.$Message.info('您已成为房主')
    },
    handlePlayCard () {
      const uid = this.userMsg.uid
      const roomId = this.roomId
      this.server.emit('playCards', {roomId, uid, cards: this.selectedCards})
    },
    handleStartGame () {
      const userMsg = this.userMsg
      const roomId = this.roomId
      this.server.emit('startGame', {
        ...userMsg,
        roomId
      })
    },
    handleSkip () {
      const roomId = this.roomId
      const uid = this.userMsg.uid
      this.server.emit('skip', {roomId, uid})
    },
    async handleLeave () {
      this.server.close()
      const userMsg = this.userMsg
      this.server.emit('leaveRooms', {
        uid: userMsg.uid,
        roomId: this.roomId
      })
      this.$router.push({name: 'Rooms'})
    }
  },
  computed: {
    canOpen () {
      return this.members.length >= 1
    },
    selectedCards () {
      return this.cards.filter(card => card.selected)
    }
  }
}
</script>
<style scoped>
.remainCards{
  position: absolute;
  top:0;
  left:0;
  width:100px;
  height:50px;
  display: flex;
  justify-content: space-around;
  align-items: center;
}
</style>

<style scoped>
.main {
  width: 100%;
  height: 100%;
  position: relative;
}
.area {
  position: absolute;
  background-color: rgba(20,110,20,.5)
}
.top,
.bottom {
  width: 90%;
  height: 25%;
}
.top {
  top: 0;
  left: 0;
  border-bottom:1px solid;
}
.bottom {
  bottom: 0;
  right: 0;
  border-top:1px solid;
}
.left {
  left: 0;
  bottom: 0;
  border-right:1px solid;

}
.right {
  right: 0;
  top: 0;
  border-left:1px solid;
  }
.left,
.right {
  width: 10%;
  height: 75%;
}
.center {
  width: 80%;
  height: 50%;
  position: absolute;
  top: 25%;
  left: 10%;
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  align-items: flex-end;
  background-color: white;
}
.tools {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin: auto;
  width: 50%;
  height: 30px;
  background-color: #333;
}
.tool {
  color: white;
  cursor: pointer;
}
.hoverToRed:hover {
  color: red;
}
.area .name {
  position: absolute;
  top:0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
  font-size: 30px;
  color: rgb(0, 204, 255);
  width:fit-content;
  height:fit-content;
  z-index: 10;
}
.area .remainHandCards{
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height:100%;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  z-index: 9;
}
.remainHandCards .card{
  width: 80%;
  height: 18%;
}
.cards {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: calc(100% - 30px);
  width: 100%;
}
.card {
  color: green;
  cursor: pointer;
  width: 19%;
  height: 80%;
  font-weight:bold;
  background-color: lemonchiffon;
  flex-wrap: nowrap;
  display: flex;
  justify-content: center;
  align-items: center;
}
.card-label {
  font-size: 16px;
}
.card-color{
  font-size: 18px;
}
.center .card {
  cursor: none;
  width: 50px;
  height: 45px;
  border-radius: 5px;
}
.cardGroup{
  display: flex;
  justify-content: space-between;
  height: 47px;
  border:1px solid;
  border-radius: 5px;
  margin-right:5px;
}
</style>
