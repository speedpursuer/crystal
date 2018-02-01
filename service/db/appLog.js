const singleton = Symbol()
const RedisDB = require('./redisDB')
const util = require ('../../util/util.js')
const ip = require('ip')

class AppLog {

    constructor(enforcer) {
        if (enforcer !== singleton) {
            throw new Error('Cannot construct ApiLog singleton')
        }
        this.db = RedisDB.instance
        this.key = `app_${util.time}`
        this.init()
    }

    static get instance() {
        if (!this[singleton]) {
            this[singleton] = new AppLog(singleton)
        }
        return this[singleton]
    }

    init() {
        this.data = {
            trades: [],
            closedAPIs: [],
        }
    }

    async recordClosedAPI(id) {
        this.data.closedAPIs.push({id, ip: ip.address()})
        await this.saveData()
    }

    async recordTrade(key) {
        this.data.trades.push(key)
        await this.saveData()
    }

    async getData() {
        return await this.db.getDataWithKey(this.key)
    }

    async saveData() {
        return await this.db.saveDataWithKey(this.data, this.key)
    }
}

module.exports = AppLog