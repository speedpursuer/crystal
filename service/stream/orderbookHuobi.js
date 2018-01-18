const OrderbookStream =require('./baseOrderbook')
const pako = require('pako')
const util = require('../../util/util')

class OrderBookStreamHuobi extends OrderbookStream {

    start() {
        for (let symbol of this.symbols) {
            this.send({
                "sub": `market.${symbol}.depth.step0`,
                "id": `${symbol}`
            })
        }
    }

    handleMessage(msg) {
        if(msg.ping) {
            this.send({pong: msg.ping})
        }else if(msg.pong) {
            this.pong()
        }else if(msg.tick){
            let data = this.parseData(msg)
            if(data.channel === 'depth') {
                this.orderbooks[data.symbol] = msg.tick
            }
        }
    }

    parseMessage(msg) {
        return super.parseMessage(pako.inflate(msg, {
            to: 'string'
        }))
    }

    parseData(msg) {
        return {
            symbol: msg.ch.split('.')[1],
            channel: msg.ch.split('.')[2]
        }
    }

    ping() {
        this.send({'ping': util.time})
    }
}

module.exports = OrderBookStreamHuobi