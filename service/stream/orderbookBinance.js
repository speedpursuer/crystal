const OrderbookStream =require('./baseOrderbook')
const util = require('../../util/util')
const _ = require('lodash')
const rp = require('request-promise')

class OrderBookStreamBinance extends OrderbookStream {

    initOrderbooks() {
        super.initOrderbooks()
        for(let symbol of this.symbols) {
            this.url += `${this.realSymbol(symbol)}@depth10/`
        }
    }

    handleMessage(msg) {
        this.orderbooks[this.getSymbol(msg)] = msg.data
    }

    getSymbol(msg) {
        return msg.stream.split('@')[0]
    }
}

module.exports = OrderBookStreamBinance
