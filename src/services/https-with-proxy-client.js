const http = require('http')
const https = require('https')

const getIPHostAndPort = require('../helpers/get-ip-host-and-port')

// free proxies: https://free-proxy-list.net/#list
const proxies = [
  '83.175.157.49:3128', // maybe working ip
  '116.98.72.205:8080',
  '152.228.152.91:443',
  '18.143.57.27:80',
  '190.61.88.147:8080',
  '138.91.159.185:80',
]

class HttpsWithProxyClientService {
  constructor(proxyConf = null) {
    this.proxyConf = proxyConf;
    this.proxyAgent = null;
    this.lastRequestHostname = null;
  }

  async _connectToProxy(url, proxyIndex = 0, retries = 3) {
    return new Promise((resolve, reject) => {
      const urlParsed = new URL(url);
      const ac = new AbortController();

      const options = {
        ...getIPHostAndPort(proxies[proxyIndex]),
        method: 'CONNECT',
        path: `${urlParsed.hostname}:443`,
        timeout: 12500,
        signal: ac.signal
      }

      console.log(options, '<-- BEFORE CONNECT');
      console.log({ proxyIndex }, '<-- BEFORE CONNECT');

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
          ac.abort()
        })
        .end();
    })
      .then(agent => agent)
      .catch(error => {
        console.log('_connectToProxy catch()', error);

        if (retries > 0) {
          return this._connectToProxy(url, proxyIndex + 1, retries - 1)
        }

        return error
      });
  }

  async getURL(url, headers = {}) {
    return new Promise(async (resolve, reject) => {
      const urlParsed = new URL(url);

      if (!this.proxyAgent || this.lastRequestHostname !== urlParsed.hostname) {
        try {
          const proxyConnection = await this._connectToProxy(url, this.proxyIndex)

          if (proxyConnection instanceof https.Agent) {
            this.proxyAgent = proxyConnection
            this.lastRequestHostname = urlParsed.hostname;
          } else {
            return reject('Failed to fetch data in time!')
          }
        } catch (e) {
          return reject(e, 'reject in getURL()');
        }
      }

      console.log(`getURL making GET request | ${urlParsed}`);
      console.log(`
        ------------ ------------ ------------ ------------
        ------------ ------------ ------------ ------------
        ------------ ------------ ------------ ------------
        ------------ ------------ ------------ ------------
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

module.exports = HttpsWithProxyClientService