const Name = '7king523_name'
const TokenName = '7king523_uid'
const getUserMsg = () => {
  const name = window.localStorage.getItem(Name)
  const uid = window.localStorage.getItem(TokenName)
  if (uid === null || name === null) {
    return null
  }
  return {
    name,
    uid
  }
}
const setUserMsg = (name, uid) => {
  window.localStorage.setItem(Name, name)
  window.localStorage.setItem(TokenName, uid)
}
export default {
  getUserMsg,
  setUserMsg
}
