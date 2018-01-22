const EventEmitter = require('events')
const OrderBookHuobi = require('./orderbookHuobi')
const OrderBookOkex = require('./orderbookOkex')
const OrderBookBitfinex = require('./orderbookBitfinex')
const OrderBookBinance = require('./orderbookBinance')
const _ = require('lodash')

const list = {
    huobipro: OrderBookHuobi,
    okex: OrderBookOkex,
    bitfinex: OrderBookBitfinex,
    binance: OrderBookBinance
}

class StreamService extends EventEmitter{
    constructor(exchanges) {
        super()
        this.init(exchanges)
    }

    init(exchanges) {
        this.streams = {}
        for(let name in exchanges) {
            let symbols = _.keys(exchanges[name])
            this.streams[name] = new list[name](symbols)
            this.setupNotify(this.streams[name])
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

    start() {
        for(let name in this.streams) {
            this.streams[name].connect()
        }
    }

    getOrderbook(eName, symbol) {
        return this.streams[eName].getOrderBookBySymbol(symbol)
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