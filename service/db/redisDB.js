const singleton = Symbol()

const bluebird = require("bluebird")
const redis = require("redis")
bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

const redisConfig = require('../../config/service/redisConfig')

class RedisDB {
    constructor(enforcer) {
        if (enforcer !== singleton) {
            throw new Error('Cannot construct RedisDB singleton')
        }
        this.initRedis()
    }

    static get instance() {
        if (!this[singleton]) {
            this[singleton] = new RedisDB(singleton)
        }
        return this[singleton]
    }

    initRedis() {
        this.client = redis.createClient({
            host: redisConfig.host,
            port: redisConfig.port,
            password: redisConfig.password
        })
        this.client.auth(redisConfig.password)
    }

    async deleteDataWithKey(key) {
        return await this.client.delAsync(key)
    }

    async getKeys(search) {
        return this.client.keysAsync(search)
    }

    async getDataWithKey(key) {
        return JSON.parse(await this.client.getAsync(key))
    }

    async saveDataWithKey(data, key) {
        await this.client.setAsync(key, JSON.stringify(data))
    }
}

module.exports = RedisDB