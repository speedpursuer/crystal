const OrderbookStream =require('./baseOrderbook')
const _ = require('lodash')
const MarketManager = require('bittrex-market')

class OrderBookStreamBittrex extends OrderbookStream {

    constructor(symbols) {
        super(symbols)
        this.marketManager = new MarketManager(false)
        this.registerUpdate()
    }

    connect() {
        for(let symbol of this.realSymbols) {
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

    // 在以下两种情况下被通知重新start client，执行doReconnect方法
    // 1. 意外断开连接时
    // 2. 主动调用this.marketManager.reset()时
    registerUpdate() {
        let that = this
        this.marketManager.on('disconnected', (client) => {
            that.doReconnect(client)
        })
        this.marketManager.on('onerror', (client) => {
            that.doReconnect(client)
        })
    }
    // 描述同上
    doReconnect(client) {
        this.stopStream()
        let retryInterval = this.counter.isOverCountAfterCount? 60 * 1000: this.autoReconnectInterval
        let that = this
        this.log(`WebSocketClient: retry in ${retryInterval}ms`)
        setTimeout(function(){
            that.log("WebSocketClient: reconnecting...")
            client.start()
        }, retryInterval)
    }

    // API自动重试时自动调用，防止重复执行。
    // reset()使ws connection断开，disconnected事件中重新start
    reconnect(e) {
        if(!this.isWorking) return
        this.stopStream()
        this.marketManager.reset()
    }

    // 设置停止工作标示，重置orderbooks，设置自动检查
    // 在两种情况下，提前执行，等待stream就绪：
    // 1. 意外断开连接
    // 2. 主动重新连接
    stopStream() {
        if(!this.isWorking) return
        this.isWorking = false
        this.log('停止stream')
        this.initOrderbooks()
        this.checkDataAvailable()
    }
}

module.exports = OrderBookStreamBittrex