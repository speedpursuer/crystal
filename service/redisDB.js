const singleton = Symbol()

const bluebird = require("bluebird")
const redis = require("redis")
const util = require ('../util/util.js')
bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)
const redisConfig = require('../config/service/redisConfig')

class RedisDB {
    constructor(enforcer) {
        if (enforcer !== singleton) {
            throw new Error('Cannot construct RedisDB singleton')
        }
        this.key = `trade_${util.time}`
        this.initRedis()
    }

    static async getInstance() {
        if (!this[singleton]) {
            this[singleton] = new RedisDB(singleton)
        }
        return this[singleton]
    }

    static async getInstanceWithAccount(totalBalance=0, totalStock=0, exchanges=[]) {
        if (!this[singleton]) {
            this[singleton] = new RedisDB(singleton)
            await this[singleton].initAccount(totalBalance, totalStock, exchanges)
        }
        return this[singleton]
    }

    async initAccount(totalBalance, totalStock, exchanges) {
        await this.saveData({
            exchanges: exchanges,
            initTotalBalance: totalBalance,
            initTotalStock: totalStock,
            details: [],
            tradeTimes: 0,
            profit: 0,
            balanceGap: 0,
            stocksGap: 0,
            startTime: util.now,
            lastUpdate: util.now,
            closedAPIs: [],
        })
    }

    initRedis() {
        this.client = redis.createClient({
            host: redisConfig.host,
            port: redisConfig.port,
            password: redisConfig.password
        })
        this.client.auth(redisConfig.password)
    }

    async recordTrade(sellName, buyName, sellResult, buyResult, amount, margin) {
        var data = await this.getData()
        data.details.push({
            sell: sellName,
            buy: buyName,
            amount: amount,
            margin: margin,
            profit: amount * margin,
            sellResult: sellResult,
            buyResult: buyResult,
            time: util.now
        })
        data.tradeTimes++
        await this.saveData(data)
    }

    async recordBalance(profit, balanceGap, stocksGap) {
        var data = await this.getData()
        data.profit = profit
        data.balanceGap = balanceGap
        data.stocksGap = stocksGap
        data.lastUpdate = util.now
        await this.saveData(data)
    }

    async recordClosedAPI(id) {
        let data = await this.getData()
        data.closedAPIs.push(id)
        await this.saveData(data)
    }

    async getData() {
        return JSON.parse(await this.client.getAsync(this.key))
    }

    async saveData(data) {
        await this.client.setAsync(this.key, JSON.stringify(data))
    }

    async deleteData() {
        return await this.client.delAsync(this.key)
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