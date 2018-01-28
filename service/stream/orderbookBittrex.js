const OrderbookStream =require('./baseOrderbook')
const _ = require('lodash')
const MarketManager = require('bittrex-market')

class OrderBookStreamBittrex extends OrderbookStream {

    constructor(symbols) {
        super(symbols)
        this.marketManager = new MarketManager(false)
    }

    connect() {
        for (let symbol of this.symbols) {
            this.doConnect(symbol)
        }
        this.checkDataAvailable()
        this.log('WS open')
    }

    doConnect(symbol) {
        let that = this
        this.marketManager.market(symbol, (err, crypto) => {
            crypto.on('orderbookUpdated', () => {
                that.orderbooks[symbol] = {
                    bids: _.slice(crypto.bids, 0, this.orderBookSize),
                    asks: _.slice(crypto.asks, 0, this.orderBookSize)
                }
            })
        })
    }
}

module.exports = OrderBookStreamBittrex