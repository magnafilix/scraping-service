const http = require('http')
const https = require('https')

const getIPHostAndPort = require('../helpers/get-ip-host-and-port')
const getUnusedItems = require('../helpers/get-unused-items')
const HTTP_RESPONSE_ERROR_MESSAGES = require('../constants/http-response-error-messages')
const PROXY_LIST = require('../constants/proxy-list')

const redisService = require('./redis')

class HttpsProxyClientService {
  constructor() {
    this.proxyAgent = null;
  }

  async _connectToProxy(
    url,
    retries = Number(process.env.CONNECT_REQUEST_RETRIES),
    proxyIndex = 0
  ) {
    return new Promise(async (resolve, reject) => {
      const urlParsed = new URL(url);
      const abortController = new AbortController();

      const allKeys = await redisService.getAllKeys();

      const unusedIPs = getUnusedItems(PROXY_LIST, allKeys)
      const currentIP = unusedIPs[proxyIndex] ?? unusedIPs[0]

      console.info({
        allKeys,
        unusedIPs,
        currentIP
      });

      if (!currentIP) {
        return reject(HTTP_RESPONSE_ERROR_MESSAGES.UNAVAILABLE)
      }

      await redisService.set(currentIP, 1)

      const options = {
        ...getIPHostAndPort(currentIP),
        method: 'CONNECT',
        path: `${urlParsed.hostname}:443`,
        timeout: Number(process.env.CONNECT_REQUEST_TIMEOUT),
        signal: abortController.signal
      }

      console.info(options, 'http request options');

      http
        .request(options)
        .on('connect', (res, socket) => {
          if (res.statusCode === 200) {
            console.info(`
              socket connection established: ${currentIP}
            `)
            resolve(new https.Agent({ socket: socket, keepAlive: true }));
          } else {
            reject(res.statusMessage)
          }
        })
        .on('error', (err) => {
          reject(err?.message)
        })
        .on('timeout', (err) => {
          reject(err?.message ?? 'timeout')
          abortController.abort()
        })
        .end();
    })
      .then(agent => agent)
      .catch(error => {
        if (retries > 0) {
          return this._connectToProxy(url, retries - 1, proxyIndex + 1)
        }

        return error === HTTP_RESPONSE_ERROR_MESSAGES.UNAVAILABLE
          ? HTTP_RESPONSE_ERROR_MESSAGES.UNAVAILABLE
          : HTTP_RESPONSE_ERROR_MESSAGES.FAILED
      });
  }

  async getURL(url, headers = {}) {
    return new Promise(async (resolve, reject) => {
      const urlParsed = new URL(url);

      try {
        const proxyConnection = await this._connectToProxy(url)

        if (proxyConnection instanceof https.Agent) {
          this.proxyAgent = proxyConnection
        } else {
          console.info(`
            Could not establish proxy connection: ${proxyConnection}
          `)
          return reject(proxyConnection)
        }
      } catch (err) {
        return reject(err);
      }

      https
        .get({
          host: urlParsed.hostname,
          path: urlParsed.pathname,
          agent: this.proxyAgent,
          headers: headers,
        }, (res) => {
          const chunks = [];

          res.on('data', (chunk) => {
            chunks.push(chunk);
          });
          res.on('end', () => {
            resolve({
              body: Buffer.concat(chunks).toString(),
              headers: res.headers,
              status: res.statusCode
            })
          });

          res.on("error", (err) => {
            reject(err);
          })

          res.setTimeout(25000, () => {
            reject('timeout')
          })
        })
        .on('error', (err) => {
          this.proxyAgent = null;
          reject(err.message);
        })
    })
  }
}

module.exports = HttpsProxyClientService