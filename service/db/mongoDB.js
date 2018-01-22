const util = require ('../../util/util.js')
const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')
const config = require('../../config/service/mongoConfig')


class Mongo {
    constructor(host=config.host, db=config.db, port=config.port, user=config.user, pwd=config.pwd) {
        this.initMongodb(host, db, port, user, pwd)
    }

    initMongodb(host, db, port, user, pwd) {
        let connectString = (port && user && pwd)? `mongodb://${user}:${pwd}@${host}:${port}/${db}`: `mongodb://${host}/${db}`
        mongoose.connect(connectString, {
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

        var staSchema = mongoose.Schema({
            pair: {type: String},
            market: {type: String},
            // from: { type: Number },
            // to: { type: Number },
            posAvg: { type: Number},
            posStd: { type: Number},
            negAvg: { type: Number},
            negStd: { type: Number},
        })

        this.staData = mongoose.model('StaData', staSchema)
    }

    async recordOrderBook(data) {
        var orderBook = new this.OrderBook(data)
        await orderBook.save()
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

    async getOrderBooks(market, exchanges, from, to) {
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
        util.log("回测数据收集完成, 数据量: ", i)
        return result
    }

    async getAllOrderBooks() {
        return await this.OrderBook.find().lean()
    }

    async recordStaData(data) {
        var staData = new this.staData(data)
        await staData.save()
    }

    orderBookKey(orderBook) {
        return `${orderBook.market}-${orderBook.exchange}-${orderBook.recordTime}`
    }
}

module.exports = Mongo