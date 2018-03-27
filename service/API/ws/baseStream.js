const EventEmitter = require('events')
const WS = require('ws')
const util = require('../../../util/util')
const Counter = require('../../../util/counter')
const config = require('./config/exchangeInfo')
const _ = require('lodash')
const AppLog = require('../../db/appLog')

const orderBookSize = 10

class BaseStream extends EventEmitter {
    constructor(symbols, exchangeInfo) {
        super()
        this.symbols = symbols
        this.exchangeInfo = exchangeInfo
        this.orderBookSize = orderBookSize
        this.isWorking = false
        this.isConnecting = false
        this.isStopping = false
        this.config()
        this.resetOrderbooks()
    }

    config() {
        this.name = this.constructor.name
        this.url = config[this.name].url
        this.needPing = config[this.name].needPing
        this.symbolPairs = config[this.name].symbolPairs
        this.autoReconnectInterval = 500
        this.counter = new Counter(60 * 60 * 1000, 10)
    }

    realSymbol(symbol) {
        let realSymbol = this.symbolPairs[symbol]
        if(!realSymbol) throw new Error(`${this.name} - symbol ${symbol} not valid in stream exchangeInfo`)
        return realSymbol
    }

    getAllOrderbooks() {
        return this.orderbooks
    }

    getOrderBookBySymbol(symbol) {
        let orderbook = this.orderbooks[this.realSymbol(symbol)]
        return this.adjustedOrderbook(orderbook)
    }

    resetOrderbooks() {
        this.orderbooks = {}
        this.realSymbols = []
        for(let symbol of this.symbols) {
            let realSymbol = this.realSymbol(symbol)
            this.realSymbols.push(realSymbol)
            this.orderbooks[realSymbol] = {
                bids: [],
                asks: []
            }
        }
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
        this.ws = new WS(this.url, null, {})

        let that = this
        this.ws.on('open', function() {
            that.openStream()
        })

        this.ws.on('message', function(msg) {
            that.handleMessage(that.parseMessage(msg))
        })

        this.ws.on('error', function(e) {
            that.reconnect(e)
        })

        this.ws.on('close', function(e) {
            that.reconnect(e)
        })
    }

    openStream() {
        this.log('WS open')
        if(this.start) {
            this.start()
        }
        this.checkDataReady()
    }

    checkDataUpdate() {
        if(this.needPing) {
            this.lastHeartBeat = util.time
            let that = this
            this.checkUpdateInterval = setInterval(function() {
                that.checkConnection()
            }, 5000)
        }
    }

    checkConnection() {
        if (util.time - this.lastHeartBeat > 10 * 1000) {
            this.reconnect("socket连接异常，正在尝试重新建立连接")
        }else {
            this.ping()
        }
    }

    reconnect(e, delay=this.autoReconnectInterval) {
        if(this.isConnecting) return
        this.isConnecting = true
        this.stopStream()
        this.resetOrderbooks()
        let that = this
        this.log(`WebSocketClient: retry in ${delay} ms`, e)
        setTimeout(function(){
            that.log("WebSocketClient: reconnecting...")
            that.connect()
        }, delay)
    }

    disconnect() {
        this.stopStream()
    }

    stopStream() {
        if(this.isStopping) return
        this.isStopping = true
        this.isWorking = false
        this.log('停止stream')
        this.stopConnection()
        this.isStopping = false
    }

    stopConnection() {
        this.stopCheckConnection()
        this.stopWS()
    }

    stopWS() {
        if(this.ws) this.ws.removeAllListeners()
    }

    stopCheckConnection() {
        if(this.checkUpdateInterval) clearInterval(this.checkUpdateInterval)
        if(this.checkReadyInterval) clearInterval(this.checkReadyInterval)
    }

    async reportErr(msg) {
        this.isWorking = false
        await AppLog.instance.recordClosedAPI(`${this.name}, reason: ${msg}`)
    }

    parseMessage(msg) {
        return JSON.parse(msg)
    }

    handleMessage() {
        throw new Error("handleMessage() must be implemented")
    }

    ping() {
        //implement as needed
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
            return null
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

    log(msg1, msg2='') {
        util.log(this.name, msg1, msg2)
    }

    checkDataReady() {
        let that = this, i = 0, maxTry = 30
        this.checkReadyInterval = util.repeat(function () {
            i++
            if(i == maxTry) {
                that.notifyOrderbookReceived(false)
            }
        }, 1000, maxTry, function () {
            if(that.isAllDataReady()) {
                that.notifyOrderbookReceived(true)
                that.checkDataUpdate()
                return true
            }
            return false
        })
    }

    isAllDataReady() {
        return !this.isOrderbookEmpty()
    }

    isOrderbookEmpty() {
        let orderbooks = this.getAllOrderbooks()
        if(_.size(orderbooks) != _.size(this.realSymbols)) return true
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
        this.isConnecting = false
        this.log(`All orderbooks received: ${flag}`)
        this.emit('started', flag)
        if(!flag) {
            let msg = 'orderbooks not fully received'
            if(this.counter.isOverCountAfterCount) {
                msg = `${msg}, too many time retry, give up`
                AppLog.instance.recordClosedAPI(`${this.name}, ${msg}`).then
            }else {
                msg = `${msg}, reconnect`
                this.reconnect(msg, 5 * 60 * 1000)
            }
            this.log(msg)
        }
    }
}

module.exports = BaseStream