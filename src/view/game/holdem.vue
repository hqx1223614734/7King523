<template>
  <div class="main">
    <div class="area top">
      <div class="players" v-if="seatingTable[1]">
        <div
          class="player"
          :class="{'currentPlayer': currentPlayer === player.uid}"
          v-for="player in seatingTable[1]"
          :key="player.uid"
        >
          <div class="player-name">{{player.name}}</div>
          <div class="role">
            <span v-if="smallB === player.uid">小盲</span>
            <span v-if="bigB === player.uid">大盲</span>
          </div>
          <div class="score" v-if="playerData">
            <p>剩余分数：{{playerData[player.uid].score}}</p>
            <p>下注分数：{{playerData[player.uid].bets}}</p>
          </div>
          <div class="discard" v-if="playerData && playerData[player.uid].isDiscard">弃牌</div>
        </div>
      </div>
    </div>
    <div class="table">
      <div class="cards" v-if="playerData">
        <div class="card" v-for="item in playerData.currentCards" :key="item.id">
          <span
            class="color"
            :style="{color: (item.color === '♥' || item.color === '♦' || item.color === '\u265B') ? 'red' : 'black'}"
          >{{item.color}}</span>
          <span class="value">{{item.label}}</span>
        </div>
      </div>
      <div class="sort">
        <div v-for="(item, index) in sortWinners" :key="item.uid">
          <div class="sort-name overflow-ellipsis"><span style="color:red">{{index + 1 + ':'}}</span>{{item.name}}</div>
          <div class="cards">
            <div class="card" v-for="item in item.handCards" :key="item.id">
              <span
                class="color"
                :style="{color: (item.color === '♥' || item.color === '♦' || item.color === '\u265B') ? 'red' : 'black'}"
              >{{item.color}}</span>
              <span class="value">{{item.label}}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="winners-name" v-if="winnerNames.length !== 0">
        <span style="color:red">赢家是：</span>
        <div class="winner-name">
          <span v-for="(item, index) in winnerNames" :key="item + index">{{item}}</span>
        </div>
      </div>
    </div>
    <div class="area left">
      <div class="players" v-if="seatingTable[2]">
        <div
          class="player"
          :class="{'currentPlayer': currentPlayer === player.uid}"
          v-for="player in seatingTable[2]"
          :key="player.uid"
        >
          <div class="player-name">{{player.name}}</div>
          <div class="role">
            <span v-if="smallB === player.uid">小盲</span>
            <span v-if="bigB === player.uid">大盲</span>
          </div>
          <div class="score" v-if="playerData">
            <p>剩余分数：{{playerData[player.uid].score}}</p>
            <p>下注分数：{{playerData[player.uid].bets}}</p>
          </div>
          <div class="discard" v-if="playerData && playerData[player.uid].isDiscard">弃牌</div>
        </div>
      </div>
    </div>
    <div class="area right">
      <div class="players" v-if="seatingTable[0]">
        <div
          class="player"
          :class="{'currentPlayer': currentPlayer === player.uid}"
          v-for="player in seatingTable[0]"
          :key="player.uid"
        >
          <div class="player-name">{{player.name}}</div>
          <div class="role">
            <span v-if="smallB === player.uid">小盲</span>
            <span v-if="bigB === player.uid">大盲</span>
          </div>
          <div class="score" v-if="playerData">
            <p>剩余分数：{{playerData[player.uid].score}}</p>
            <p>下注分数：{{playerData[player.uid].bets}}</p>
          </div>
          <div class="discard" v-if="playerData && playerData[player.uid].isDiscard">弃牌</div>
        </div>
      </div>
    </div>
    <div class="area bottom" :class="{'currentPlayer': currentPlayer === userMsg.uid}">
      <div class="tools">
        <Button
          type="primary"
          icon="md-cube"
          shape="circle"
          v-show="gameOver && canOpen && isOwner"
          size="small"
          @click="handleStartGame"
        >开始</Button>
        <Button
          type="primary"
          icon="md-cube"
          shape="circle"
          v-show="!gameOver && nextRound"
          size="small"
          @click="handleNextRound"
        >下一轮</Button>
        <Button
          type="primary"
          icon="md-checkmark"
          shape="circle"
          v-show="!gameOver && currentPlayer === userMsg.uid && selectedBetsLength !== 0"
          @click="handleBets"
        >下注</Button>
        <Button
          type="primary"
          icon="md-fastforward"
          shape="circle"
          v-show="!gameOver && currentPlayer === userMsg.uid && playerData[userMsg.uid].bets !== 0"
          @click="handleSkip"
        >跳过</Button>
        <Button
          type="primary"
          icon="md-close-circle"
          shape="circle"
          v-show="!gameOver && currentPlayer === userMsg.uid && (playerData[userMsg.uid].bets !== 0 || userMsg.uid !== playerData.smallB)"
          @click="handleDiscard"
        >弃牌</Button>
        <Icon class="tool hoverToRed" type="md-log-out" size="20" @click="handleLeave"/>
      </div>
      <div class="msg" v-if="playerData">
        <span v-if="smallB === userMsg.uid">小盲</span>
        <span v-if="bigB === userMsg.uid">大盲</span>
        <div class="score">
          剩余分数：
          <span>{{playerData[userMsg.uid].score}}</span>
        </div>
        <div class="bets">
          下注分数：
          <span>{{playerData[userMsg.uid].bets}}</span>
        </div>
      </div>
      <div class="bet-cards" v-show="!gameOver && currentPlayer === userMsg.uid">
        <div
          class="bet-card"
          v-for="(bet, index) in bets"
          :key="bet.value"
          :style="{transform: bet.isSelected ? 'translateY(-10px)' : 'translateY(0px)'}"
          @click="bets[index].isSelected = !bets[index].isSelected"
        >
          <span>{{bet.value}}</span>
        </div>
      </div>
      <div class="hand-cards" v-if="playerData">
        <div class="card" v-for="item in playerData[userMsg.uid].handCards" :key="item.id">
          <span
            class="color"
            :style="{color: (item.color === '♥' || item.color === '♦' || item.color === '\u265B') ? 'red' : 'black'}"
          >{{item.color}}</span>
          <span class="value">{{item.label}}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import UCommon from '@/util/common'
import io from 'socket.io-client'
export default {
  name: '',
  props: [],
  components: {},
  data () {
    return {
      winnerNames: [],
      sortWinners: [],
      userMsg: {},
      roomId: '',
      gameOver: true,
      seatingTable: [],
      playerData: null,
      isOwner: false,
      currentPlayer: '',
      canOpen: false,
      smallB: '',
      bigB: '',
      nextRound: false,
      bets: [
        {
          value: 1,
          isSelected: false
        },
        {
          value: 2,
          isSelected: false
        },
        {
          value: 4,
          isSelected: false
        },
        {
          value: 5,
          isSelected: false
        },
        {
          value: 8,
          isSelected: false
        }
      ]
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
        server.on('nextRound', this.onNextRound)
        server.on('playerData', this.onPlayerData)
        server.on('message', this.onMessage)
        server.on('updateOwner', this.onUpdateOwner)
        server.on('currentCards', this.onCurrentCards)
        server.on('gameOver', this.onGameOver)
        server.emit('joinRooms', {
          uid: userMsg.uid,
          name: userMsg.name,
          roomId: this.roomId
        })
      })
      this.server = server
    },
    onNextRound () {
      this.nextRound = true
    },
    onPlayerData (data) {
      this.playerData = data
      this.currentPlayer = data.currentPlayer
      this.smallB = data.smallB
      this.bigB = data.bigB
      this.winnerNames = data.winnerNames
      this.sortWinners = data.sortWinners
      if (data.winnerNames.length !== 0) {
        this.currentPlayer = ''
      }
      this.bets = [
        {
          value: 1,
          isSelected: false
        },
        {
          value: 2,
          isSelected: false
        },
        {
          value: 4,
          isSelected: false
        },
        {
          value: 5,
          isSelected: false
        },
        {
          value: 8,
          isSelected: false
        }
      ]
    },
    onUpdateRoomMembers (members) {
      this.canOpen = members.length >= 3
      const uid = this.userMsg.uid
      const index = members.findIndex(member => member.uid === uid)
      members = [...members.slice(index + 1), ...members.slice(0, index)]
      const length = members.length
      if (length <= 0) {
        this.seatingTable = []
      } else if (length <= 1) {
        this.seatingTable = [null, [members[0]]]
      } else if (length <= 2) {
        this.seatingTable = [[members[0]], null, [members[1]]]
      } else if (length <= 3) {
        this.seatingTable = [[members[0]], [members[1]], [members[2]]]
      } else if (length <= 4) {
        this.seatingTable = [[members[0]], [members[1], members[2]], [members[3]]]
      } else if (length <= 5) {
        this.seatingTable = [[members[0], members[1]], [members[2]], [members[3], members[4]]]
      } else if (length <= 6) {
        this.seatingTable = [[members[0], members[1]], [members[2], members[3]], [members[4], members[5]]]
      } else if (length <= 7) {
        this.seatingTable = [[members[0], members[1]], [members[2], members[3], members[4]], [members[5], members[6]]]
      }
    },
    onGameOver (status) {
      this.gameOver = status
      if (status) {
        this.$Message.info('游戏结束')
      }
    },
    onUpdateOwner (data) {
      this.isOwner = true
      this.$Message.info('您已成为房主')
    },
    onMessage (data) {
      const func = data.type
      if (typeof this.$Message[func] === 'function') {
        this.$Message[func](data.msg)
      }
    },
    handleDiscard () {
      this.server.emit('discard', {
        roomId: this.roomId,
        uid: this.userMsg.uid
      })
    },
    handleSkip () {
      this.server.emit('playCards', {
        roomId: this.roomId,
        uid: this.userMsg.uid,
        cards: 0
      })
    },
    async handleLeave () {
      const userMsg = this.userMsg
      this.server.emit('leaveRooms', {
        uid: userMsg.uid,
        roomId: this.roomId
      })
      this.server.close()
      this.$router.push({name: 'Rooms'})
    },
    handleBets () {
      this.server.emit('playCards', {
        roomId: this.roomId,
        uid: this.userMsg.uid,
        cards: this.selectedBetsValue
      })
    },
    handleStartGame () {
      const userMsg = this.userMsg
      const roomId = this.roomId
      this.server.emit('startGame', {
        ...userMsg,
        roomId
      })
    },
    handleNextRound () {
      this.nextRound = false
      this.server.emit('nextRound', this.roomId)
    }
  },
  computed: {
    selectedBetsLength () {
      return this.bets.filter(bet => bet.isSelected).length
    },
    selectedBetsValue () {
      return this.bets.filter(bet => bet.isSelected).reduce((sum, bet) => sum + bet.value, 0)
    }
  }
}
</script>
<style scoped>
.sort{
  margin-bottom:20px;
}
.sort > div{
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
}
.sort-name{
  color: greenyellow;
  font-size: 20px;
  width:120px;
  text-align: center;
}
.overflow-ellipsis{
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.winners-name{
  display: flex;
  justify-content: center;
  font-size: 20px;
}
.winner-name{
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: greenyellow;
}
</style>

<style scoped>
.cards {
  display: flex;
  justify-content: center;
}
.hand-cards {
  position: absolute;
  right: 0;
  top: 0;
  width: 20%;
  height: 100%;
  display: flex;
  justify-content: space-around;
  align-items: center;
}
.card {
  width: 40px;
  height: 40px;
  background-color: lemonchiffon;
  border-radius: 5px;
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: center;
}
.card .color {
  font-size: 20px;
}
.card .value {
  font-size: 16px;
}
</style>

<style scoped>
.role {
  color: red;
}
.msg {
  width: 20%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background-color: transparent;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
}
.msg span {
  color: red;
}
.bet-cards {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
  width: 50%;
  height: calc(100% - 40px);
  display: flex;
  justify-content: space-around;
  align-items: center;
}
.bet-card {
  width: 30%;
  height: 90%;
  border: 1px solid;
  border-radius: 5px;
  background-color: chartreuse;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>

<style scoped>
.discard{
  position: absolute;
  right:0;
  bottom: 0;
  color:red;
}
.players {
  width: 100%;
  height: 100%;
}
.top .players {
  display: flex;
  justify-content: space-around;
  flex-wrap: nowrap;
  align-items: center;
}
.top .player {
  width: 20%;
  height: 80%;
  border: 1px solid;
  border-radius: 5px;
}
.players {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
}
.player {
  position: relative;
  width: 80%;
  height: 30%;
  border: 1px solid;
  border-radius: 5px;
  background-color: lemonchiffon;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.player-name {
  font-size: 20px;
  color: rgb(0, 204, 255);
}
</style>

<style scoped>
.main {
  position: relative;
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
  width: 60%;
  height: 30px;
  background-color: rgba(55, 55, 55, 0.5);
}
.tool {
  cursor: pointer;
  color: black;
}
.hoverToRed:hover {
  color: red;
}
.table {
  width: 60%;
  height: 66%;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
  background-color: dimgrey;
}
.area {
  position: absolute;
  background-color: aqua;
}
.top,
.bottom {
  width: 100%;
  height: 17%;
  left: 0;
  background-color: rgba(20, 110, 20, 0.5);
}
.top {
  top: 0;
}
.bottom {
  bottom: 0;
}
.left,
.right {
  width: 20%;
  height: 66%;
  top: 0;
  bottom: 0;
  margin: auto;
}
.left {
  left: 0;
}
.right {
  right: 0;
}
</style>
