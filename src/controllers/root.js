const http = require('http')
const https = require('https')

const getIPAddressHostnameAndPort = require('../helpers/get-ip-address-hostname-and-port')
const getUrlProtocol = require('../helpers/get-url-protocol')
const RETRY_CODES = require('../constants/retry-codes')

// find free proxies at https://free-proxy-list.net/#list
const proxies = [
  '198.49.68.80:80',
  '34.87.84.105:80',
  '146.59.243.214:80',
  '176.168.127.74:80',
  '162.144.236.128:80',
]

const client = {
  http: http,
  https: https
}

const retryGet = async (url, proxyIndex = 0, retries = 3, backoff = 300) => {
  const options = {
    path: url,
    ...getIPAddressHostnameAndPort(proxies[proxyIndex])
  }

  return new Promise((resolve, reject) => {
    client[getUrlProtocol(url)]
      .get(url, res => {
        let data = ''

        const { statusCode } = res

        if (statusCode < 200 || statusCode > 299) {
          if (retries > 0 && RETRY_CODES.includes(statusCode)) {
            setTimeout(() => retryGet(url, proxyIndex + 1, retries - 1, backoff * 2), backoff)
          } else {
            reject(res)
          }
        } else {
          res.on('data', d => {
            data += d
          })
          res.on('end', () => {
            resolve({ data, headers: res.headers })
          })
        }
      })
      .on('error', error => {
        if (retries > 0) {
          return retryGet(url, proxyIndex + 1, retries - 1, backoff * 2)
        }

        reject(error)
      })
  })
}

module.exports = {
  processUrl: async (req, res) => {
    const { query: { url } } = req

    try {
      const { data: html, headers } = await retryGet(url)
      res.status(200).json({ html, headers })
    } catch (error) {
      const { statusCode, statusMessage } = error
      res.status(statusCode ?? 500).json({ message: statusMessage ?? error.message })
    }
  }
}