const COLOR = ['♥', '♠', '♦', '♣']
const VALUE = [
  {
    label: 'A',
    value: 1
  },
  {
    label: '2',
    value: 15,
    special: true
  },
  {
    label: '3',
    value: 14,
    special: true
  },
  {
    label: '4',
    value: 4
  },
  {
    label: '5',
    value: 16,
    special: true
  },
  {
    label: '6',
    value: 6
  },
  {
    label: '7',
    value: 19,
    special: true
  },
  {
    label: '8',
    value: 8
  },
  {
    label: '9',
    value: 9
  },
  {
    label: '10',
    value: 10
  },
  {
    label: 'J',
    value: 11
  },
  {
    label: 'Q',
    value: 12
  },
  {
    label: 'K',
    value: 13
  }
]
class Game {
  constructor (roomId, room, persons, io) {
    this.roomId = roomId
    this.members = room.members
    this.membersLength = this.members.length
    this.room = room
    this.persons = persons
    this.io = io
  }
  init () {
    this.currentPlayer = this.room.uid
    this.currentPlayerIndex = this.members.findIndex(uid => uid === this.currentPlayer)
    this.skipNum = 1
    this.cards = this.getAllCards()
    this.outCards = []
    this.currentCards = []
    this.handCards = {}
    this.upsetCards()
  }
  updateRoom(room){
    this.room = room
    this.members = room.members
  }
  updatePerson (person) {
    this.persons = person
    this.update()
  }
  update () {
    this.broadcastCurrentPlayer()
    this.broadcastCurrentCards()
    this.broadcastHandCards()
  }
  getAllCards () {
    let card = []
    let id = 1
    VALUE.forEach(value => {
      COLOR.forEach(color => {
        card.push({
          ...value,
          color,
          id: id++,
          king: false
        })
      })
    })
    card.push({
      id: id++,
      color: '♥',
      label: '大王',
      value: 18,
      king: true
    })
    card.push({
      id: id++,
      color: '♣',
      label: '小王',
      value: 17,
      king: true
    })
    return card
  }
  upsetCards () {
    this.cards.sort((a, b) => Math.random() > 0.5 ? 1 : -1)
  }
  dealCards () {
    this.members.forEach(uid => {
      let cards = this.cards.splice(0, 5)
      this.handCards[uid] = cards
    })
    this.broadcastHandCards()
  }
  start () {
    this.init()
    this.dealCards()
    this.broadcastCurrentCards()
    this.broadcastCurrentPlayer()
    this.broadcasRemainCards()
  }
  end () {
    this.currentCards = []
    this.currentPlayer = ''
    this.handCards = {}
    this.update()
  }
  playCards (uid, cards) {
    if (!this.isInRoom(uid)) return
    const currentCardsLength = this.currentCards.length
    if (this.playRules(cards) && (currentCardsLength === 0 || this.rules(cards, this.currentCards[currentCardsLength - 1]))) {
      this.currentCards.push(cards)
      this.sendMsg(uid, 'message', {
        type: 'info',
        msg: '出牌成功'
      })
      this.skipNum = 1
      this.broadcastCurrentCards()
      this.handCards[uid] = this.handCards[uid].filter(card => cards.findIndex(c => c.id === card.id) === -1)
      this.broadcastHandCards()
      this.nextPlayer()

      if (this.isGameOver()) {
        this.broadcastMsg('gameOver')
      }
    } else {
      this.sendMsg(uid, 'message', {
        type: 'error',
        msg: '出牌失败,请检查规则'
      })
    }
  }
  skip (uid) {
    if (!this.isInRoom(uid)) return
    this.skipNum += 1
    if (this.skipNum === this.members.length) {
      this.outCards = [...this.outCards, this.currentCards]
      this.currentCards = []
      this.broadcastCurrentCards()
      this.fillCards()
    }
    this.nextPlayer()
  }
  broadcastCurrentPlayer () {
    this.broadcastMsg('currentPlayer', this.currentPlayer)
  }
  broadcastCurrentCards () {
    this.broadcastMsg('currentCards', this.currentCards)
  }
  broadcastHandCards () {
    this.broadcastMsg('handCards', this.handCards)
  }
  broadcasRemainCards () {
    this.broadcastMsg('remainCards', this.cards)
  }
  fillCards () {
    for (let index = 0; index < this.membersLength; index += 1) {
      const uid = this.members[index]
      const handLength = this.handCards[uid].length
      if (handLength !== 5) {
        let needNum = 5 - handLength
        if (this.cards.length <= needNum) {
          this.handCards[uid] = [...this.handCards[uid], ...this.cards]
          this.cards = []
          break
        } else {
          this.handCards[uid] = [...this.handCards[uid], ...this.cards.splice(0, needNum)]
        }
      }
    }
    this.broadcasRemainCards()
    this.broadcastHandCards()
  }
  nextPlayer () {
    let currentPlayerIndex = this.currentPlayerIndex
    let currentPlayer = this.currentPlayer
    let circleNum = 1
    do {
      circleNum += 1
      if (circleNum > 2) {
        this.skipNum += 1
      }
      currentPlayerIndex = (currentPlayerIndex + 1) % this.membersLength
      currentPlayer = this.members[currentPlayerIndex]
    } while (this.handCards[currentPlayer].length === 0)
    this.currentPlayer = currentPlayer
    this.currentPlayerIndex = currentPlayerIndex
    this.broadcastCurrentPlayer()
  }
  isInRoom (uid) {
    return this.members.includes(uid)
  }
  isGameOver () {
    let emptyNum = 0
    this.members.forEach(uid => {
      if (this.handCards[uid].length === 0)emptyNum += 1
    })
    if (emptyNum >= this.membersLength - 1) return true
    return false
  }
  playRules (cards) {
    if (cards.length === 2 && cards[0].king && cards[1].king) return true
    if (cards.length !== 1) {
      for (let index = 0; index < cards.length - 1; index += 1) {
        if (cards[index].value !== cards[index + 1].value) {
          return false
        }
      }
    }
    return true
  }
  rules (newCards, oldCards) {
    if (newCards.length === 1 && oldCards.length === 1 && newCards[0].special && oldCards[0].special) {
      return newCards[0].value >= oldCards[0].value
    }
    if (newCards.length === oldCards.length) {
      if (newCards[0].value > oldCards[0].value) {
        return true
      }
    } else if (newCards.length > oldCards.length && newCards.length >= 3) {
      return true
    }
    return false
  }
  sendMsg (uid, event, msg = '') {
    this.io.to(this.persons[uid].socketId).emit(event, msg)
  }
  broadcastMsg (event, msg = '') {
    this.io.in(this.roomId).emit(event, msg)
  }
}
module.exports = Game
