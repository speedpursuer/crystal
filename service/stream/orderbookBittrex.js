const OrderbookStream =require('./baseOrderbook')
const _ = require('lodash')
const MarketManager = require('bittrex-market')

class OrderBookStreamBittrex extends OrderbookStream {

    connect() {
        for(let symbol of this.symbols) {
            this.doConnect(symbol)
        }
        this.checkDataAvailable()
        this.log('WS open')
    }

    stopConnection() {
        this.marketManager.reset()
    }

    doConnect(symbol) {
        this.marketManager = new MarketManager(false)
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