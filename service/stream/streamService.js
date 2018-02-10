const singleton = Symbol()
const EventEmitter = require('events')
const OrderBookHuobi = require('./orderbookHuobi')
const OrderBookOkex = require('./orderbookOkex')
const OrderBookBitfinex = require('./orderbookBitfinex')
const OrderBookBinance = require('./orderbookBinance')
const OrderBookBittrex = require('./orderbookBittrex')
const _ = require('lodash')

const list = {
    huobipro: OrderBookHuobi,
    okex: OrderBookOkex,
    bitfinex: OrderBookBitfinex,
    binance: OrderBookBinance,
    bittrex: OrderBookBittrex
}

class StreamService extends EventEmitter{

    constructor(enforcer) {
        if (enforcer !== singleton) {
            throw new Error('Cannot construct StreamService singleton')
        }
        super()
        this.registerdStream = {}
    }

    static get instance() {
        if (!this[singleton]) {
            this[singleton] = new StreamService(singleton)
        }
        return this[singleton]
    }

    register(exchangeId, symbol) {
        if(!this.registerdStream[exchangeId]) {
            this.registerdStream[exchangeId] = []
        }
        this.registerdStream[exchangeId].push(symbol)
    }

    start() {
        this.creatStreams()
        this.connect()
    }

    creatStreams() {
        this.streams = {}
        for(let exchangeId in this.registerdStream) {
            let symbols = this.registerdStream[exchangeId]
            this.streams[exchangeId] = new list[exchangeId](symbols)
            this.setupNotify(this.streams[exchangeId])
        }
    }

    connect() {
        for(let exchangeId in this.streams) {
            this.streams[exchangeId].connect()
        }
    }

    setupNotify(stream) {
        this.counter = new Counter(_.size(this.streams))
        let that = this
        stream.once('started', function (isSuccess) {
            let result = that.counter.count(isSuccess)
            if(result !== null) {
                that.emit('started', result)
            }
        })
    }

    getOrderbook(exchangeId, symbol) {
        return this.streams[exchangeId].getOrderBookBySymbol(symbol)
    }

    reconnectStream(exchangeId) {
        this.streams[exchangeId].reconnect(new Error(`reconnect stream of ${exchangeId}`))
    }

    disconnectStream(exchangeId) {
        this.streams[exchangeId].disconnect()
    }
}

class Counter {
    constructor(total) {
        this.total = total
        this.successCount = 0
        this.failureCount = 0
    }

    count(isSuccess) {
        if(isSuccess) {
            this.successCount++
        }else {
            this.failureCount++
        }
        if(this.successCount + this.failureCount == this.total) {
            if(this.failureCount > 0) {
                return false
            }else {
                return true
            }
        }
        return null
    }
}

module.exports = StreamService