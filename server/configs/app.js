const env = require('./env')
const development = {
  port: 8665
}
const production = {
  port: 80
}
const config = {
  development,
  production
}
module.exports = config[env]
