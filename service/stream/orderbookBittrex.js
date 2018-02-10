const OrderbookStream =require('./baseOrderbook')
const _ = require('lodash')
const MarketManager = require('bittrex-market')

class OrderBookStreamBittrex extends OrderbookStream {

    // constructor(symbols) {
    //     super(symbols)
    //     this.index = 0
    // }

    connect() {
        this.marketManager = new MarketManager(false)
        this.registerUpdate()
        for(let symbol of this.realSymbols) {
            this.connectBySymbol(symbol)
        }
        this.checkDataAvailable()
        this.log('WS open')
        // this.index++
        // this.marketManager.index = this.index
    }

    connectBySymbol(symbol) {
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

    // 在以下两种情况下被通知重新start client，执行reconnect
    // 1. 意外断开连接时
    // 2. 主动调用this.marketManager.reset()时
    registerUpdate() {
        let that = this
        this.marketManager.on('disconnected', (client) => {
            that.doReconnect('disconnected')
        })
        this.marketManager.on('onerror', (client) => {
            that.doReconnect('onerror')
        })
        this.marketManager.stopped = false
    }

    doReconnect(msg) {
        if(!this.marketManager.stopped) {
            this.reconnect(msg)
        }
    }

    disconnect() {
        this.marketManager.stopped = true
        this.stopStream()
    }

    stopStream() {
        if(this.isStopping) return
        this.marketManager.reset()
        super.stopStream()
    }
}

module.exports = OrderBookStreamBittrex