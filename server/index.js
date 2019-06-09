const express = require('express')
const app = express()

const server = require('http').Server(app)
const io = require('socket.io')(server)
io.onconnection(socket => {
  console.log(socket.id)
})
server.listen(8008)
