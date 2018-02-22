const BaseStream = require('./baseStream')
const Account = require('./class/bitfinexAccount')
const util = require('../../../util/util')
const _ = require('lodash')
const crypto = require('crypto-js')


class StreamBitfinex extends BaseStream {

    constructor(symbols, exchangeInfo) {
        super(symbols, exchangeInfo)
        this.orderbookMgr = new OrderbookMgr()
        this.account = new Account()
    }

    start() {
        this.send(this.authPayload)
        for (let symbol of this.realSymbols) {
            this.send({
                event: 'subscribe',
                channel: "book",
                pair: symbol,
                prec: "P0"
            })
        }
    }

    get authPayload() {
        const authNonce = Date.now()
        const authPayload = 'AUTH' + authNonce
        const authSig = crypto
            .HmacSHA384(authPayload, this.exchangeInfo.secret)
            .toString(crypto.enc.Hex)

        return {
            apiKey: this.exchangeInfo.apiKey,
            authSig,
            authNonce,
            authPayload,
            event: 'auth'
        }
    }

    handleMessage(msg) {
        if (msg.event) {
            this.handleEvent(msg)
        }else {
            let result = this.parseData(msg)
            if(result.data === 'hb') {
                // this.pong()
            }else if(result.chanId === 0){
                this.handleOrder(result.type, result.data)
                this.handleWallet(result.type, result.data)
            }else {
                this.handleOrderbook(result.chanId, result.data)
            }
        }
    }

    handleOrder(type, data) {
        if(util.contains(type, ['os', 'on', 'ou', 'oc'])) {
            this.account.handleOrderData(type, data)
        }
    }

    handleWallet(type, data) {
        if(util.contains(type, ['ws', 'wu'])) {
            this.account.handleWalletData(type, data)
        }
    }

    parseData(msg) {
        let result
        if(msg[0] === 0) {
            result = {
                chanId: msg[0],
                type: msg[1],
                data: msg[2]
            }
        }else {
            result = {
                chanId: msg[0],
                data: msg[1]
            }
        }
        return result
    }

    handleOrderbook(chanId, data) {
        this.orderbookMgr.setOrderbooks(chanId, data)
    }

    handleEvent(msg) {
        if(msg.event === 'subscribed') {
            this.orderbookMgr.createChannel(msg.chanId, msg.symbol)
        }else if(msg.event === 'pong') {
            this.pong()
        }else if(msg.event === 'info') {
            switch (msg.code){
                case 20051:
                    this.reconnect("Stop/Restart Websocket Server")
                    break
                case 20060:
                    this.reportErr('Entering in Maintenance mode').then()
                    break
                case 20061:
                    this.reconnect("Maintenance ended")
                    break
                default:
                    this.log(`Other info: ${JSON.stringify(msg)}`)
                    break
            }
        }
    }

    isAllDataReady() {
        return super.isAllDataReady() && this.account.isAccountReady()
    }

    getAllOrderbooks() {
        return this.orderbookMgr.orderbooks
    }

    getOrderBookBySymbol(symbol) {
        return this.adjustedOrderbook(this.orderbookMgr.getOrderbookBySymbol(this.realSymbol(symbol)))
    }

    getOpenOrdersBySymbol(symbol) {
        return this.account.getOpenOrdersBySymbol(this.realSymbol(symbol))
    }

    getAccount() {
        return this.account.getAccount()
    }

    ping() {
        this.send({event: 'ping', cid: util.time})
    }
}

class OrderbookMgr {
    constructor() {
        this.channels = {}
        this.orderbooks = {}
    }

    getOrderbookBySymbol(symbol) {
        let OrderbookObj = this.orderbooks[symbol]? this.orderbooks[symbol]: new Orderbook()
        return OrderbookObj.orderbook
    }

    setOrderbooks(chanId, data) {
        if(!this.hasSnapshoot(chanId)) {
            this.createOrderbook(chanId, data)
        }else {
            this.updateOrderbook(chanId, data)
        }
    }

    createChannel(chanId, symbol) {
        this.channels[chanId] = {
            symbol: symbol,
            hasSnapshoot: false
        }
    }

    //Private methods
    symbol(chanId) {
        let channel = this.channels[chanId]
        return channel? channel.symbol: null
    }

    hasSnapshoot(chanId) {
        return this.channels[chanId].hasSnapshoot
    }

    setSnapshoot(chanId, flag) {
        this.channels[chanId].hasSnapshoot = flag
    }

    getOrderbook(chanId) {
        return this.orderbooks[this.symbol(chanId)]
    }

    setOrderbook(chanId, orderbook) {
        this.orderbooks[this.symbol(chanId)] = orderbook
    }

    createOrderbook(chanId, data) {
        let orderbook = new Orderbook()
        for(let item of data) {
            let result = this.parseData(item)
            this.addOrder(orderbook, result.price, result.amount)
        }
        this.setOrderbook(chanId, orderbook)
        this.setSnapshoot(chanId, true)
    }

    updateOrderbook(chanId, data) {
        let orderbook = this.getOrderbook(chanId)
        let result = this.parseData(data)
        if(result.count === 0) {
            this.deleteOrder(orderbook, result.price, result.amount)
        }else {
            this.addOrder(orderbook, result.price, result.amount)
        }
    }

    addOrder(orderbook, price, amount) {
        let side = this.getSide(amount)
        orderbook.addPrice(side, price, amount)
    }

    deleteOrder(orderbook, price, amount) {
        let side = this.getSide(amount)
        orderbook.deletePriceIfExisting(side, price)
    }

    getSide(amount) {
        return amount >= 0 ? 'bids' : 'asks'
    }

    parseData(data) {
        return {
            price: data[0],
            count: data[1],
            amount: data[2]
        }
    }
}

class Orderbook {
    constructor() {
        this.asks = {}
        this.bids = {}
    }

    addPrice(side, price, amount) {
        this[side][price] = [price, Math.abs(amount)]
    }

    deletePriceIfExisting(side, price) {
        if(this[side][price] !== undefined) {
            delete this[side][price]
        }
    }

    get orderbook() {
        return {
            asks: _.values(this.asks),
            bids: _.values(this.bids)
        }
    }
}

module.exports = StreamBitfinex