const bluebird = require("bluebird")
const redis = require("redis")
const client = redis.createClient()
const util = require ('../util/util.js')
bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)
const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')

class Database {

    // constructor(prefix) {
    //     this.prefix = prefix
    // }

    // async init(totalBalance, totalStock, exchanges) {        
    //     await this.initRedis(totalBalance, totalStock, exchanges)
    //     await this.initMongodb()        
    // }

    initMongodb() {
        mongoose.connect('mongodb://localhost/crystal', {
            useMongoClient: true                
        })

        var orderBookSchema = mongoose.Schema({
            exhange: {type: String},
            market: {type: String},
            timestamp: { type: Number },
            bids: { type: Array},
            asks: { type: Array},
            datetime: { type: String },
        })

        this.OrderBook = mongoose.model('OrderBook', orderBookSchema)
    }

    async initAccount(strategyName, totalBalance, totalStock, exchanges) {
        var time = util.now
        this.key = `${strategyName}, ${time}`
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
        return this
    }

    async recordTrade(sellName, buyName, amount, gap) {
        var data = await this.getData()
        data.details.push({
            sell: sellName,
            buy: buyName,
            amount: amount,
            gap: gap,
            profit: amount * gap,            
            time: util.now
        })
        data.tradeTimes++       
        await this.saveData(data)
    }

    async recordBalance(balanceGap, stocksGap) {
        var data = await this.getData()
        data.balanceGap = balanceGap
        data.stocksGap = stocksGap
        data.lastUpdate = util.now
        await this.saveData(data)
    }

    async recordOrderBook(data) {    
        var orderBook = new this.OrderBook(data)
        await orderBook.save()
        // var result = await this.OrderBook.findOne()
        // return result
    }

    async getOrderBook() {    
        return await this.OrderBook.find().exec()
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
}
var database = new Database()
database.initMongodb()   
module.exports = database