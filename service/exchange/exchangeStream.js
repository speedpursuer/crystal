const Exchange = require ('./exchange')
const StreamService = require('../stream/streamService')
const util = require ('../../util/util.js')

class ExchangeStream extends Exchange {
    constructor(exchangeDelegate, info, crypto, fiat, debug) {
        super(exchangeDelegate, info, crypto, fiat, debug)
        StreamService.instance.register(this.id, this.symbol)
    }

    async fetchOrderBook() {
        this.orderBooks = StreamService.instance.getOrderbook(this.id, this.symbol)
        this.checkOrderbook()
    }
}

module.exports = ExchangeStream