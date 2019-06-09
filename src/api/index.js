import {get} from '@/util/request'
const getRooms = (params) => get('/api/room/all', params)
const addRooms = params => get('/api/room/add', params)
const joinRoom = params => get('/api/room/join', params)
const leaveRoom = params => get('/api/room/leave', params)
export default {
  getRooms,
  addRooms,
  joinRoom,
  leaveRoom
}
