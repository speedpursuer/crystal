const singleton = Symbol()
const EventEmitter = require('events')
const OrderBookHuobi = require('./stream/orderbookHuobi')
const OrderBookOkex = require('./stream/orderbookOkex')
const OrderBookBitfinex = require('./stream/orderbookBitfinex')
const OrderBookBinance = require('./stream/orderbookBinance')
const _ = require('lodash')

const list = {
    huobipro: OrderBookHuobi,
    okex: OrderBookOkex,
    bitfinex: OrderBookBitfinex,
    binance: OrderBookBinance
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
        stream.on('started', function (isSuccess) {
            let result = that.counter.count(isSuccess)
            if(result !== null) {
                that.emit('started', result)
            }
        })
    }

    getOrderbook(exchangeId, symbol) {
        // let result = this.streams[exchangeId].getOrderBookBySymbol(symbol)
        // console.log(exchangeId, symbol, result)
        // return result
        return this.streams[exchangeId].getOrderBookBySymbol(symbol)
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