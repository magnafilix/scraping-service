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

      const allKeys = await redisService.getAll();

      const unusedIPs = getUnusedItems(PROXY_LIST, allKeys)
      const currentIP = unusedIPs[proxyIndex] ?? unusedIPs[0]

      console.log({
        allKeys,
        unusedIPs,
        currentIP
      });

      if (!currentIP) {
        retries = 0
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

      console.log(options, '<-- HTTP OPTIONS BEFORE CONNECT');

      http
        .request(options)
        .on('connect', (res, socket) => {
          if (res.statusCode === 200) {
            console.info(`
              _connectToProxy on connect resolve | IP: ${options.host}:${options.port}
              code: ${res.statusCode}, message: ${res.statusMessage}
            `);
            resolve(new https.Agent({ socket: socket, keepAlive: true }));
          } else {
            console.log(`
              _connectToProxy on connect reject | IP: ${options.host}:${options.port}
              code: ${res.statusCode}, message: ${res.statusMessage}
            `);
            reject(res.statusMessage)
          }
        })
        .on('error', (err) => {
          console.log(`
            _connectToProxy on error reject | IP: ${options.host}:${options.port}
            message: ${err?.message}
          `);
          reject(err?.message)
        })
        .on('timeout', (err) => {
          console.log(`
            _connectToProxy on timeout reject | IP: ${options.host}:${options.port}
            message: ${err?.message ?? 'timeout'}
          `);
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
          return reject(proxyConnection)
        }
      } catch (e) {
        return reject(e, 'reject in getURL()');
      }

      console.log(`getURL making GET request | ${urlParsed}`);
      console.log(`
        ------------ ------------ ------------ ------------ ------------
        ------------ ------------ ------------ ------------ ------------
        ------------ ------------ ------------ ------------ ------------
        ------------ ------------ ------------ ------------ ------------
      `);

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
          console.log(`getURL req on error reject | ${err.message}`);
          this.proxyAgent = null;
          reject(err.message);
        })
    })
  }
}

module.exports = HttpsProxyClientService