const OrderBookHuobi = require('../service/stream/orderbookHuobi')
const OrderBookOkex = require('../service/stream/orderbookOkex')
const OrderBookBitfinex = require('../service/stream/orderbookBitfinex')
const OrderBookBinance = require('../service/stream/orderbookBinance')

const list = {
    huobipro: OrderBookHuobi,
    okex: OrderBookOkex,
    bitfinex: OrderBookBitfinex,
    binance: OrderBookBinance
}

class StreamService {
    constructor(exchanges) {
        this.exchanges = exchanges
        this.init()
    }

    init() {
        this.streams = {}
        for(let name of this.exchanges) {
            this.streams[name] = new list[name](this.exchanges[name].symbols)
        }
    }
}