const RedisDB = require('./redisDB')
const util = require ('../../util/util.js')

class TradeLog {
    constructor() {
        this.db = RedisDB.instance
        this.key = `trade_${util.time}`
    }

    async init(tradeSymbol, totalBalance, totalStock, exchanges) {
        this.data = {
            tradeSymbol: tradeSymbol,
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
            stopped: null,
        }
        await this.saveData()
    }

    async recordTrade(sellName, buyName, sellResult, buyResult, amount, margin) {
        this.data.details.push({
            sell: sellName,
            buy: buyName,
            amount: amount,
            margin: margin,
            profit: amount * margin,
            sellResult: sellResult,
            buyResult: buyResult,
            time: util.now
        })
        this.data.tradeTimes++
        await this.saveData()
    }

    async recordBalance(profit, balanceGap, stocksGap) {
        this.data.profit = profit
        this.data.balanceGap = balanceGap
        this.data.stocksGap = stocksGap
        this.data.lastUpdate = util.now
        await this.saveData()
    }

    async recordStopped(reason) {
        this.data.stopped = {reason}
        await this.saveData()
    }

    async getData() {
        return await this.db.getDataWithKey(this.key)
    }

    async saveData() {
        return await this.db.saveDataWithKey(this.data, this.key)
    }

    async deleteData() {
        return await this.db.deleteDataWithKey(this.key)
    }
}

module.exports = TradeLog