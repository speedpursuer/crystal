const bluebird = require("bluebird")
const redis = require("redis")
const client = redis.createClient()
const moment = require('moment');
const util = require ('../util/util.js')
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

class Database {

    constructor(prefix) {
        this.prefix = prefix
    }

    async init(totalBalance, totalStock, exchanges) {
        var time = this.now
        this.key = `${this.prefix}, ${time}`
        var data = {
            exchanges: exchanges,
            initTotalBalance: totalBalance,
            initTotalStock: totalStock,
            details: [],
            tradeTimes: 0,
            balanceGap: 0,
            stocksGap: 0,
            startTime: time,
            lastUpdate: time,
        }
        await this.saveData(data)
    }

    async recordTrade(sellName, buyName, amount, gap) {
        var data = await this.getData()
        data.details.push({
            sell: sellName,
            buy: buyName,
            amount: amount,
            gap: gap,
            profit: amount * gap,            
            time: this.now
        })
        data.tradeTimes++       
        await this.saveData(data)
    }

    async recordBalance(balanceGap, stocksGap) {
        var data = await this.getData()
        data.balanceGap = balanceGap
        data.stocksGap = stocksGap
        data.lastUpdate = this.now
        await this.saveData(data)
    }

    async getData() {
        return JSON.parse(await client.getAsync(this.key))
    }

    async saveData(data) {
        await client.setAsync(this.key, JSON.stringify(data))
    }

    async deleteData() {
        return await client.delAsync(this.key)
    }

    get now() {
        return moment().format("YYYY-MM-DD HH:mm:ss")
    }
}
module.exports = Database