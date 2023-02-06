const redis = require('redis')

class Redis {
  constructor() {
    this._redis = null
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

  async set(key, value, ex = Number(process.env.REDIS_EX)) {
    return this._redis.set(key, value, { EX: ex })
  }

  async getAllKeys() {
    return this._redis.keys('*');
  }
}

module.exports = new Redis()