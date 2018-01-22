const OrderbookStream =require('./baseOrderbook')
const util = require('../../util/util')
const _ = require('lodash')

class OrderBookStreamBitfinex extends OrderbookStream {

    constructor(symbols) {
        super(symbols)
        this.orderbookMgr= new OrderbookMgr()
    }

    start() {
        for (let symbol of this.symbols) {
            this.send({
                event: 'subscribe',
                channel: "book",
                pair: symbol,
                prec: "P0"
            })
        }
    }

    handleMessage(msg) {
        if (msg.event) {
            this.handleEvent(msg)
        }else {
            let result = this.parseData(msg)
            if(result.data === 'hb') {
                this.pong()
            }else {
                this.handleOrderbook(result.chanId, result.data)
            }
        }
    }

    parseData(msg) {
        return {
            chanId: msg[0],
            data: msg[1]
        }
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
                    this.reconnect(new Error("Stop/Restart Websocket Server"))
                    break
                case 20060:
                    this.reportErr(new Error('Entering in Maintenance mode.')).then()
                    break
                case 20061:
                    this.reconnect(new Error("Maintenance ended"))
                    break
                default:
                    this.log(`Other info: ${JSON.stringify(msg)}`)
                    break
            }
        }
    }

    getAllOrderbooks() {
        return this.orderbookMgr.orderbooks
    }

    getOrderBookBySymbol(symbol) {
        return this.adjustedOrderbook(this.orderbookMgr.getOrderbookBySymbol(this.realSymbol(symbol)))
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

module.exports = OrderBookStreamBitfinex