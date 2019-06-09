import Axios from 'axios'
import _ from 'lodash'
const SUCCESS_CODE = 200

const REQUEST_CONFIG = {
  method: 'get',
  timeout: 1000 * 60 * 3,
  headers: {
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: true
}

const createError = ({ url, method, code, message, params, data }) => {
  const errorObject = {
    url,
    method,
    code,
    message,
    params,
    data
  }
  const error = new Error(JSON.stringify(errorObject, null, 2))
  error.msg = message
  return error
}
export const request = (url, options, isShowError) => {
  const config = Object.assign({}, REQUEST_CONFIG, options)

  return new Promise((resolve, reject) => {
    Axios(url, config)
      .then((res) => {
        if (res.status === SUCCESS_CODE) {
          return res.data
        }
        if (res.status === 500) {
          window.location.reload()
          return
        }
        if (res.status === 403) {
          return
        }
        if (isShowError) {
          // showError(res.msg);
        }
        const error = createError({
          url,
          method: config.method,
          code: res.status,
          message: res.msg,
          params: config.params,
          data: config.data
        })
        reject(error)
      }).then(data => {
        let code = _.get(data, ['code'], 1)
        if (code === 302) {
          window.location.href = window.location.origin + '/#/login'
        } else {
          resolve(data)
        }
      })
      .catch((e) => {
        if (e.response.status === 500) {
          if (window.location.host.includes('localhost')) return
          window.location.reload()
        } else if (isShowError) {
          // showError(e.message);
        }
      })
  })
}

export const get = (url, params, isShowError = true) => {
  const options = Object.assign({}, { params }, { method: 'get' })
  return request(url, options, isShowError)
}

export const post = (url, params, isShowError = true) => {
  const options = Object.assign({}, { data: params }, { method: 'post' })
  return request(url, options, isShowError)
}
