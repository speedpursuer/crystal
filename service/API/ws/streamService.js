const singleton = Symbol()
const EventEmitter = require('events')
const StreamHuobi = require('./streamHuobi')
const StreamOkex = require('./streamOkex')
const StreamBitfinex = require('./streamBitfinex')
const StreamBinance = require('./streamBinance')
const StreamBittrex = require('./streamBittrex')
const util = require ('../../../util/util.js')
const _ = require('lodash')
const deferred = require('deferred')

const list = {
    huobipro: StreamHuobi,
    okex: StreamOkex,
    bitfinex: StreamBitfinex,
    binance: StreamBinance,
    bittrex: StreamBittrex
}

class StreamService extends EventEmitter{

    constructor(enforcer) {
        if (enforcer !== singleton) {
            throw new Error('Cannot construct StreamService singleton')
        }
        super()
        this.registerdStream = {}
        this.started = false
    }

    static get instance() {
        if (!this[singleton]) {
            this[singleton] = new StreamService(singleton)
        }
        return this[singleton]
    }

    register(exchangeInfo, symbol) {
        if(this.started) {
            this.disconnect()
        }
        if(!this.registerdStream[exchangeInfo.id]) {
            this.registerdStream[exchangeInfo.id] = {
                exchangeInfo, symbols: []
            }
        }
        this.registerdStream[exchangeInfo.id].symbols.push(symbol)
    }

    async start() {
        this.startDef = deferred()
        this.creatStreams()
        this.connect()
        return this.startDef.promise
    }

    creatStreams() {
        this.streams = {}
        for(let exchangeId in this.registerdStream) {
            let symbols = this.registerdStream[exchangeId].symbols
            let exchangeInfo = this.registerdStream[exchangeId].exchangeInfo
            this.streams[exchangeId] = new list[exchangeId](symbols, exchangeInfo)
            this.setupNotify(this.streams[exchangeId])
        }
    }

    connect() {
        for(let exchangeId in this.streams) {
            this.streams[exchangeId].connect()
        }
        this.started = true
    }

    disconnect() {
        for(let exchangeId in this.streams) {
            this.streams[exchangeId].disconnect()
        }
        this.started = false
    }

    setupNotify(stream) {
        this.counter = new Counter(_.size(this.streams))
        let that = this
        stream.once('started', function (isSuccess) {
            let result = that.counter.count(isSuccess)
            if(result !== null) {
                util.log(result? "stream started": "stream not started successfully")
                that.startDef.resolve(result)
                // that.emit('started', result)
            }
        })
    }

    getOrderbook(exchangeId, symbol) {
        return this.streams[exchangeId].getOrderBookBySymbol(symbol)
    }

    getOpenOrders(exchangeId, symbol) {
        return this.streams[exchangeId].getOpenOrdersBySymbol(symbol)
    }

    getAccount(exchangeId) {
        return this.streams[exchangeId].getAccount()
    }

    reconnectStream(exchangeId) {
        this.streams[exchangeId].reconnect(`reconnect stream of ${exchangeId}`)
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