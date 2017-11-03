const bluebird = require("bluebird")
const redis = require("redis")
const client = redis.createClient()
const util = require ('../util/util.js')
bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)
const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')

class Database {

    initMongodb() {
        mongoose.connect('mongodb://localhost/nike_10_30', {
            useMongoClient: true                
        })

        var orderBookSchema = mongoose.Schema({
            exchange: {type: String},
            market: {type: String},
            timestamp: { type: Number },
            bids: { type: Array},
            asks: { type: Array},
            datetime: { type: String },
            recordTime: { type: String},
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
        return await this.OrderBook.find()
    }

    async getOrderBooksTimeline(market, exchanges, from, to) {
        return this.OrderBook.distinct(
            'recordTime',
            {
                exchange: { $in: exchanges },
                recordTime: { $gt: from - 1, $lt: to + 1},
                market: market
            }
        )
    }

    async getOrderBooks(exchange, recordTime) {
        var orderBook = await this.OrderBook.find(
            {
                exchange: exchange,
                recordTime: recordTime
            }
        ).lean()
        return {
            bids: orderBook[0].bids,
            asks: orderBook[0].asks
        }
    }

    async getOrderBooks2(market, exchanges, from, to) {
        var result = {}
        var orderBooks = await this.OrderBook.find(
            {
                exchange: { $in: exchanges },
                recordTime: { $gt: from - 1, $lt: to + 1},
                market: market
            }
        ).lean()
        var i = 0
        for(var orderBook of orderBooks) {
            result[this.orderBookKey(orderBook)] = {
                bids: orderBook.bids,
                asks: orderBook.asks
            }
            i++
        }   
        util.log("Data retrieved from db, count: ", i)
        return result
    }

    orderBookKey(orderBook) {
        return `${orderBook.market}-${orderBook.exchange}-${orderBook.recordTime}`
    }

    // async getOrderBooks1(exchanges, recordTime) {
    //     var result = {}

    //     var orderBooks = await this.OrderBook.find(
    //         {
    //             exchange: { $in: exchanges },
    //             recordTime: recordTime
    //         }
    //     ).lean()
    
    //     for(var orderBook of orderBooks) {
    //         result[orderBook.exchange] = {
    //             bids: orderBook.bids,
    //             asks: orderBook.asks
    //         }
    //     }      

    //     return result
    // }

    // async getOrderBooks(exchanges, from, to) {
    //     return this.OrderBook.find(
    //         {
    //             exchange: { $in: exchanges },
    //             recordTime: { $gt: from - 1, $lt: to + 1}
    //         }
    //     )
    // }

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