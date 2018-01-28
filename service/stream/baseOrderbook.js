const EventEmitter = require('events')
const WS = require('ws')
const util = require('../../util/util')
const Counter = require('../../util/counter')
const config = require('./config/exchangeInfo')
const _ = require('lodash')
const RedisDB = require('../db/redisDB')

const orderBookSize = 10

class OrderbookStream extends EventEmitter {
    constructor(symbols) {
        super()
        this.config()
        this.init(symbols)
        this.isWorking = false
        this.orderBookSize = orderBookSize
        // this.connect()
    }

    config() {
        this.name = this.constructor.name
        this.url = config[this.name].url
        this.needPing = config[this.name].needPing
        this.symbolPairs = config[this.name].symbolPairs
        this.autoReconnectInterval = 100
        this.counter = new Counter(60 * 1000, 5)
    }

    realSymbol(symbol) {
        let realSymbol = this.symbolPairs[symbol]
        if(!realSymbol) throw new Error('symbol not valid')
        return realSymbol
    }

    getAllOrderbooks() {
        return this.orderbooks
    }

    getOrderBookBySymbol(symbol) {
        let orderbook = this.orderbooks[this.realSymbol(symbol)]
        return this.adjustedOrderbook(orderbook)
    }

    init(symbols) {
        this.orderbooks = {}
        this.symbols = []
        for(let symbol of symbols) {
            let realSymbol = this.realSymbol(symbol)
            this.symbols.push(realSymbol)
            this.orderbooks[realSymbol] = {
                bids: [],
                asks: []
            }
        }
        // this.emptyOrderbooks = this.orderbooks
    }

    send(data) {
        let that = this
        this.ws.send(JSON.stringify(data), function(e) {
            if(e !== undefined) {
                that.reconnect(e)
            }
        })
    }

    connect() {
        let that = this
        this.ws = new WS(this.url, null, {})

        this.ws.on('open', function() {
            that.log('WS open')
            if(that.start) {
                that.start()
            }
            if(that.needPing) {
                that.lastHeartBeat = util.time
                setInterval(function() {
                    that.checkConnection()
                }, 5000)
            }
            that.checkDataAvailable()
        })

        this.ws.on('message', function(msg) {
            that.handleMessage(that.parseMessage(msg))
        })

        this.ws.on('error', function(e) {
            that.reconnect(e)
        })

        this.ws.on('close', function(e) {
            that.reconnect(e)
            // switch (e){
            //     case 1000:
            //         this.log("WebSocket: closed")
            //         break
            //     default:
            //         this.log("WebSocket abnormally closed")
            //         that.reconnect(e)
            //         break
            // }
        })
    }

    reconnect(e) {
        // this.orderbooks = this.emptyOrderbooks
        this.isWorking = false
        this.ws.removeAllListeners()
        if(this.counter.isOverCountAfterCount) {
            this.reportErr(new Error('Retried failed, giving up')).then()
        }else {
            this.log(`WebSocketClient: retry in ${this.autoReconnectInterval}ms`, e)
            let that = this
            setTimeout(function(){
                that.log("WebSocketClient: reconnecting...")
                that.connect()
            }, this.autoReconnectInterval)
        }
    }

    checkConnection() {
        if (util.time - this.lastHeartBeat > 8000) {
            this.reconnect(new Error("socket 连接断开，正在尝试重新建立连接"))
        }else {
            this.ping()
        }
    }

    async reportErr(e) {
        this.isWorking = false
        util.log.red(e)
        // this.orderbooks = this.emptyOrderbooks
        // let database = await RedisDB.getInstanceWithAccount()
        // await database.recordClosedAPI(this.name)
    }

    parseMessage(msg) {
        return JSON.parse(msg)
    }

    handleMessage() {
        throw new Error("handleMessage() must be implemented")
    }

    ping() {
        throw new Error("ping() must be implemented")
    }

    pong() {
        this.lastHeartBeat = util.time
    }

    adjustedOrderbook(orderbook) {
        return {
            bids: this.adjustedList(orderbook, 'bids'),
            asks: this.adjustedList(orderbook, 'asks')
        }
    }

    adjustedList(orderbook, side) {
        if(!this.isWorking) {
            return []
        }
        return this.formatNumber(_.slice(this.sortOrderList(orderbook[side], side), 0, this.orderBookSize))
    }

    formatNumber(list) {
        let newList = []
        for(let item of list) {
            newList.push([Number(item[0]), Number(item[1])])
        }
        return newList
    }

    sortOrderList(list, side) {
        return list.sort(function(a, b) {
            if (side === 'bids') {
                return +a[0] >= +b[0] ? -1 : 1
            } else {
                return +a[0] <= +b[0] ? -1 : 1
            }
        })
    }

    log(message) {
        util.log(this.name, message)
    }

    checkDataAvailable() {
        let that = this, i = 0, maxTry = 20
        util.repeat(function () {
            i++
            if(i == maxTry) {
                that.notifyOrderbookReceived(false)
            }
        }, 1000, maxTry, function () {
            if(!that.isOrderbookEmpty()) {
                that.notifyOrderbookReceived(true)
                return true
            }
            return false
        })
    }

    isOrderbookEmpty() {
        let orderbooks = this.getAllOrderbooks()
        if(_.size(orderbooks) != _.size(this.symbols)) return true
        for(let key in orderbooks) {
            let orderbook = orderbooks[key]
            if(orderbook.bids.length == 0 || orderbook.asks.length == 0) {
                return true
            }
        }
        return false
    }

    notifyOrderbookReceived(flag) {
        this.isWorking = flag
        this.emit('started', flag)
    }
}

module.exports = OrderbookStream