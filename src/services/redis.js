const redis = require('redis')

class Redis {
  constructor() {
    this._redis = null

    // seconds * minutes * hours
    this.ttl = 1 * 1 * 1
  }

  async init() {
    if (!this._redis) {
      const client = redis.createClient()
      await client.connect()

      this._redis = client;
    }
  }

  async get(key) {
    return this._redis.get(key)
  }

  async set(key, value, ex = this.ttl) {
    return this._redis.set(key, value, { EX: ex })
  }

  async getAll() {
    return this._redis.keys('*');
  }
}

module.exports = new Redis()