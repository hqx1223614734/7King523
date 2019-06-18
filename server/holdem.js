const COLOR = ['♥', '♠', '♦', '♣']
const VALUE = [
  {
    label: 'A',
    value: 14
  },
  {
    label: '2',
    value: 2
  },
  {
    label: '3',
    value: 3
  },
  {
    label: '4',
    value: 4
  },
  {
    label: '5',
    value: 4
  },
  {
    label: '6',
    value: 6
  },
  {
    label: '7',
    value: 7
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
class Holdem {
  constructor (roomId, room, persons, io) {
    this.roomId = roomId
    this.members = room.members
    this.membersLength = this.members.length
    this.room = room
    this.persons = persons
    this.io = io
    this.gameStatus = true
  }
  updateRoom (room) {
    this.room = room
    this.members = room.members
  }
  updatePerson (person) {
    this.persons = person
  }
  getGameStatus () {
    return this.gameStatus
  }
  initPlayer () {
    let player = {}
    this.members.forEach(uid => {
      player[uid] = {
        handCards: [],
        score: 90,
        bets: 0,
        isDiscard: false
      }
    })
    return player
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
    // card.push({
    //   id: id++,
    //   color: '\u265B',
    //   label: '大王',
    //   value: 15,
    //   king: true
    // })
    // card.push({
    //   id: id++,
    //   color: '\u265D',
    //   label: '小王',
    //   value: 14,
    //   king: true
    // })
    this.upsetCards(card)
    return card
  }
  dealCards () {
    this.members.forEach(uid => {
      let cards = this.cards.splice(0, 2)
      this.playerData[uid].handCards = cards
    })
    this.broadcastPlayerData()
  }
  upsetCards (cards) {
    cards.sort(() => Math.random() > 0.5 ? 1 : -1)
  }
  start () {
    this.changeGameStatus(false)
    this.playerData = this.initPlayer()
    this.init()
    this.broadcastPlayerData()
  }
  init () {
    this.cards = this.getAllCards()
    this.playerData.currentPlayer = this.room.uid
    this.playerData.currentPlayerIndex = this.members.findIndex(uid => uid === this.playerData.currentPlayer)
    this.playerData.smallB = this.playerData.currentPlayer
    this.playerData.smallBIndex = this.playerData.currentPlayerIndex
    this.playerData.bigBIndex = (this.playerData.smallBIndex + 1) % this.membersLength
    this.playerData.bigB = this.members[this.playerData.bigBIndex]
    this.playerData.currentCards = []
    this.playerData.sortWinners = []
    this.playerData.winnerNames = []
    this.stepNum = 1
    this.skpiNum = 0
    this.discardNum = 0
  }
  nextRound () {
    const smallB = this.playerData.bigB
    const smallBIndex = this.playerData.bigBIndex
    this.init()
    this.playerData.smallBIndex = smallBIndex
    this.playerData.smallB = smallB
    this.playerData.bigBIndex = (smallBIndex + 1) % this.membersLength
    this.playerData.bigB = this.members[this.playerData.bigBIndex]
    this.playerData.currentPlayer = smallB
    this.playerData.currentPlayerIndex = smallBIndex
    this.members.forEach(uid => {
      this.playerData[uid].handCards = []
      this.playerData[uid].bets = 0
      this.playerData[uid].isDiscard = false
    })
    this.broadcastPlayerData()
  }
  nextPlayer () {
    const index = this.playerData.currentPlayerIndex
    this.playerData.currentPlayerIndex = (index + 1) % this.membersLength
    this.playerData.currentPlayer = this.members[this.playerData.currentPlayerIndex]
    if (this.playerData[this.playerData.currentPlayer].isDiscard) {
      this.skpiNum += 1
      this.nextPlayer()
    }
  }
  end () {
    this.changeGameStatus(true)
  }
  discard (uid) {
    this.playerData[uid].isDiscard = true
    this.discardNum += 1
    if (this.discardNum === this.membersLength - 1) {
      let winUid = this.members.filter(uid => !this.playerData[uid].isDiscard)
      let remainUid = this.members.filter(uid => this.playerData[uid].isDiscard)
      this.settlement(winUid)
      const sortWinners = [...winUid, ...remainUid].map(uid => ({
        uid,
        name: this.persons[uid].name,
        handCards: this.playerData[uid].handCards
      }))
      const winnerNames = [this.persons[winUid[0]].name]
      this.playerData.sortWinners = sortWinners
      this.playerData.winnerNames = winnerNames
      this.broadcastPlayerData()
      this.sendMsg(this.room.uid, 'nextRound')
      return
    }
    this.nextPlayer()
    this.broadcastPlayerData()
  }
  settlement (uids) {
    let allScore = this.members.map(uid => this.playerData[uid].bets).reduce((sum, value) => sum + value, 0)
    let winScore = uids.map(uid => this.playerData[uid].bets).reduce((sum, value) => sum + value, 0)
    let score = allScore - winScore
    uids.forEach(uid => {
      this.playerData[uid].score += score / uids.length + winScore / uids.length
    })
    this.members.forEach(uid => {
      this.playerData[uid].bets = 0
    })
  }
  playCards (uid, bets) {
    if (this.stepNum === 1) {
      const bigB = this.playerData.bigB
      this.playerData[bigB].score -= 2 * bets
      this.playerData[bigB].bets = 2 * bets
      this.nextPlayer()
      this.dealCards()
    } else {
      if (this.playerData[uid].bets + bets < this.getMaxBets()) {
        this.sendMsg(uid, 'message', {
          type: 'info',
          msg: '请加大筹码'
        })
        return
      }
    }
    this.playerData[uid].score -= bets
    this.playerData[uid].bets += bets
    if (this.shouldCutCards()) {
      if (bets === 0) {
        this.skpiNum += 1
      }
      if (bets !== 0 || this.skpiNum >= this.membersLength) {
        let length = this.playerData.currentCards.length
        if (length === 0) {
          this.playerData.currentCards = [...this.cards.splice(0, 3)]
        } else if (length >= 5) {
          const sortScore = getWin(this.members, this.playerData, this.playerData.currentCards)
          const sortWinners = sortScore.map(score => ({
            uid: score.uid,
            score: score.score,
            name: this.persons[score.uid].name,
            handCards: this.playerData[score.uid].handCards
          }))
          let winners = []
          sortScore.forEach(s => {
            if (winners.length === 0 || winners[0].score === s.score) {
              winners.push(s)
            } else if (winners[0].score < s.score) {
              winners = [s]
            }
          })
          this.settlement(winners.map(win => win.uid))
          const winnerNames = winners.map(win => this.persons[win.uid].name)
          this.playerData.sortWinners = sortWinners
          this.playerData.winnerNames = winnerNames
          this.broadcastPlayerData()
          this.sendMsg(this.room.uid, 'nextRound')
          return
        } else {
          this.playerData.currentCards.push(this.cards.shift())
        }
        this.playerData.currentPlayer = this.playerData.smallB
        this.playerData.currentPlayerIndex = this.playerData.smallBIndex
        if (this.playerData[this.playerData.currentPlayer].isDiscard) {
          this.nextPlayer()
        }
        this.skpiNum = 0
      } else {
        this.nextPlayer()
      }
    } else {
      this.nextPlayer()
    }
    this.broadcastPlayerData()
    this.stepNum += 1
  }
  getMaxBets () {
    return this.members.filter(uid => !this.playerData[uid].isDiscard).map(uid => this.playerData[uid].bets).reduce((sum, value) => sum > value ? sum : value, -1)
  }
  shouldCutCards () {
    let result = true
    let bets = this.members.filter(uid => !this.playerData[uid].isDiscard).map(uid => this.playerData[uid].bets)
    for (let index = 0; index < bets.length - 1; index += 1) {
      result = result && bets[index] === bets[index + 1]
    }
    return result
  }
  changeGameStatus (status) {
    this.gameStatus = status
    this.broadcastMsg('gameOver', status)
  }
  broadcastPlayerData () {
    this.broadcastMsg('playerData', this.playerData)
  }
  sendMsg (uid, event, msg = '') {
    this.io.to(this.persons[uid].socketId).emit(event, msg)
  }
  broadcastMsg (event, msg = '') {
    this.io.in(this.roomId).emit(event, msg)
  }
}
function getWin (members, playerData, tableCards) {
  let scores = members.map(uid => ({
    uid,
    score: getScore([...tableCards, ...playerData[uid].handCards])
  }))
  return scores.sort((a, b) => b.score - a.score)
}
// let c1 = [
//   {
//     color: '♥',
//     value: 14
//   },
//   {
//     color: '♥',
//     value: 13
//   },
//   {
//     color: '♥',
//     value: 12
//   },
//   {
//     color: '♦',
//     value: 14
//   },
//   {
//     color: '♠',
//     value: 14
//   },
//   {
//     color: '♥',
//     value: 11
//   },
//   {
//     color: '♦',
//     value: 10
//   }
// ]
// let c2 = [ { color: '♦', value: 14 },
//   { color: '♠', value: 14 },
//   { color: '♥', value: 12 },
//   { color: '♥', value: 11 },
//   { color: '♥', value: 10 } ]
// console.log(compute(c2))

function getScore (cards7) {
  cards7.sort((a, b) => b.value - a.value)
  let score = -1
  for (let x = 0; x < 6; x += 1) {
    for (let y = x + 1; y < 7; y += 1) {
      const card5 = cards7.filter((value, index) => index !== x && index !== y)
      const computeC = compute(card5)
      score = Math.max(score, computeC)
    }
  }
  return score
}
function compute (cards5) {
  if (isColorFlush(cards5)) {
    return 10000000
  }
  if (isColor(cards5)) {
    return 8000000
  }
  if (isFlush(cards5)) {
    return 6000000 + cards5.reduce((sum, card) => sum + card.value, 0)
  }
  // 判断41
  if (cards5[0].value === cards5[1].value && cards5[0].value === cards5[2].value && cards5[0].value === cards5[3].value) {
    return cards5[0].value * 500000
  } else if (cards5[1].value === cards5[2].value && cards5[1].value === cards5[3].value && cards5[1].value === cards5[4].value) {
    return cards5[1].value * 500000
  }
  // 判断32
  if (cards5[0].value === cards5[1].value && cards5[0].value === cards5[2].value && cards5[3].value === cards5[4].value) {
    return cards5[0].value * 60000
  } else if (cards5[2].value === cards5[3].value && cards5[2].value === cards5[4].value && cards5[0].value === cards5[1].value) {
    return cards5[2].value * 60000
  }
  // 判断 311
  if (cards5[0].value === cards5[1].value && cards5[0].value === cards5[2].value) {
    return cards5[0].value * 7000 + 16000
  } else if (cards5[2].value === cards5[3].value && cards5[2].value === cards5[4].value) {
    return cards5[2].value * 7000 + 16000
  } else if (cards5[1].value === cards5[2].value && cards5[1].value === cards5[3].value) {
    return cards5[1].value * 7000 + 16000
  }
  // 判断221
  if (cards5[0].value === cards5[1].value && cards5[2].value === cards5[3].value) {
    return Math.pow(2, cards5[0].value) + Math.pow(2, cards5[2].value) + cards5[4].value / 4 + 2000
  } else if (cards5[0].value === cards5[1].value && cards5[3].value === cards5[4].value) {
    return Math.pow(2, cards5[0].value) + Math.pow(2, cards5[3].value) + cards5[2].value / 4 + 2000
  } else if (cards5[1].value === cards5[2].value && cards5[3].value === cards5[4].value) {
    return Math.pow(2, cards5[1].value) + Math.pow(2, cards5[3].value) + cards5[0].value / 4 + 2000
  }

  // 判断2111
  let sum = cards5.reduce((sum, card) => sum + card.value, 0)
  if (cards5[0].value === cards5[1].value) {
    return sum + cards5[0].value * 100
  } else if (cards5[1].value === cards5[2].value) {
    return sum + cards5[1].value * 100
  } else if (cards5[2].value === cards5[3].value) {
    return sum + cards5[2].value * 100
  } else if (cards5[3].value === cards5[4].value) {
    return sum + cards5[3].value * 100
  }
  // 判断11111
  return sum
}
function isColorFlush (cards) {
  return isColor(cards) && isFlush(cards)
}
function isColor (cards) {
  return (cards[0].color === cards[1].color && cards[0].color === cards[2].color && cards[0].color === cards[3].color && cards[0].color === cards[4].color)
}
function isFlush (cards) {
  return (cards[0].value === cards[1].value + 1 && cards[0].value === cards[2].value + 2 && cards[0].value === cards[3].value + 3 && cards[0].value === cards[4].value + 4)
}
module.exports = Holdem
