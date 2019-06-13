const md5 = require('md5')
const path = require('path')
const express = require('express')
const app = express()
const Game = require('./game')
// -------------公共数据--------------
const DATA = {
  rooms: [],
  persons: {}
}
// -------------路由接口-------------
app.use(express.static(path.join(__dirname, './public')))

app.get('/api/room/all', (req, res) => {
  res.send(Object.keys(DATA.rooms).map(roomId => ({
    name: DATA.rooms[roomId].name,
    members: DATA.rooms[roomId].members,
    roomId,
    isStart: DATA.rooms[roomId].god ? !DATA.rooms[roomId].god.getGameStatus() : false
  })))
})
app.get('/api/room/add', (req, res) => {
  const {roomName} = req.query
  const roomId = md5(roomName + new Date())
  DATA.rooms[roomId] = {
    name: roomName,
    members: [],
    uid: '',
    god: null,
    isStart: false
  }
  res.send({
    done: true,
    roomId
  })
})
// -------------socket-------------
const server = require('http').Server(app)
const io = require('socket.io')(server)

io.on('connection', socket => {
  const socketId = socket.id
  const {uid, name} = socket.handshake.query
  if (DATA.persons[uid]) {
    DATA.persons[uid].socketId = socketId
  } else {
    DATA.persons[uid] = {
      socketId,
      name,
      roomId: ''
    }
  }
  socket.on('joinRooms', data => {
    const {uid, name, roomId} = data
    if (DATA.rooms[roomId] === undefined) {
      socket.emit('message', {
        type: 'error',
        msg: '该房间不存在'
      })
      return
    }
    const members = DATA.rooms[roomId].members
    if (DATA.rooms[roomId].god && !DATA.rooms[roomId].god.getGameStatus()) {
      socket.emit('message', {
        type: 'error',
        msg: '房间已开始游戏'
      })
      return
    }
    if (DATA.persons[uid].roomId !== '') {
      if (DATA.persons[uid].roomId !== roomId) {
        socket.emit('message', {
          type: 'error',
          msg: '请先退出原来房间再进入新房间'
        })
      } else {
        socket.join(roomId)
        socket.emit('message', {
          type: 'info',
          msg: '加入房间'
        })
        if (DATA.rooms[roomId].uid === uid) {
          socket.emit('updateOwner')
        }
        DATA.rooms[roomId].god && DATA.rooms[roomId].god.updatePerson(DATA.persons)
        io.sockets.in(roomId).emit('updateRoomMembers', DATA.rooms[roomId].members.map(uid => ({uid, name: DATA.persons[uid].name})))
      }
      return
    }
    if (members.length >= 4) {
      socket.emit('message', {
        type: 'error',
        msg: '房间已满'
      })
      return
    } else if (members.length === 0) {
      DATA.rooms[roomId].uid = uid
      socket.emit('updateOwner')
    }
    socket.join(roomId)
    DATA.rooms[roomId].members.push(uid)

    socket.emit('message', {
      type: 'info',
      msg: '加入房间'
    })
    io.sockets.in(roomId).emit('updateRoomMembers', DATA.rooms[roomId].members.map(uid => ({uid, name: DATA.persons[uid].name})))
  })
  socket.on('leaveRooms', data => {
    const {uid, roomId} = data
    if (DATA.rooms[roomId] === undefined) {
      socket.emit('message', {
        type: 'error',
        msg: '该房间不存在'
      })
      return
    }
    socket.leave(roomId)
    DATA.rooms[roomId].god && DATA.rooms[roomId].god.end()
    let members = DATA.rooms[roomId].members.filter(id => id !== uid)

    DATA.rooms[roomId].members = members
    if (members.length >= 1 && DATA.rooms[roomId].uid === uid) {
      DATA.rooms[roomId].uid = members[0]
      io.to(DATA.persons[members[0]].socketId).emit('updateOwner')
      DATA.rooms[roomId].god && DATA.rooms[roomId].god.updateRoom(DATA.rooms[roomId])
    }
    DATA.persons[uid].roomId = ''
    socket.emit('message', {
      type: 'info',
      msg: '退出房间'
    })
    io.in(roomId).emit('updateRoomMembers', DATA.rooms[roomId].members.map(uid => ({uid, name: DATA.persons[uid].name})))
  })
  socket.on('startGame', data => {
    let {uid, name, roomId} = data
    DATA.rooms[roomId].god = new Game(roomId, DATA.rooms[roomId], DATA.persons, io)

    DATA.rooms[roomId].god.start()
  })
  socket.on('playCards', ({roomId, uid, cards}) => {
    DATA.rooms[roomId].god.playCards(uid, cards)
  })
  socket.on('skip', ({roomId, uid}) => {
    DATA.rooms[roomId].god.skip(uid)
  })
})
server.listen(3000)
console.log('服务器运行在3000端口')

/** rooms
 * rooms: {
 *   id: '',
 *   name: '',
 *   members: [],
 *   uid: ''
 * }
 * persons: {
 *   uid: {
 *     socketId: '',
 *     name: '',
 *     roomId: ''
 *   }
 * }
 */
