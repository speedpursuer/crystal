const OrderbookStream =require('./baseOrderbook')
const util = require('../../util/util')
const _ = require('lodash')

class OrderBookStreamOkex extends OrderbookStream {

    start() {
        let data = []
        for (let symbol of this.symbols) {
            data.push({
                event: 'addChannel',
                channel: `ok_sub_spot_${symbol}_depth_10`
            })
        }
        this.send(data)
    }

    handleMessage(msg) {
        if (msg.event == 'pong') {
            this.pong()
        }else if(this.hasStreamData(msg)) {
            let result = this.parseData(msg)
            if(result.data.asks && result.data.bids) {
                this.orderbooks[this.getSymbolFromChannel(result.channel)] = {
                    bids: result.data.bids,
                    asks: result.data.asks
                }
            }
        }
    }

    hasStreamData(msg) {
        return msg.constructor === Array && msg.length === 1
    }

    parseData(msg) {
        return msg[0]
    }

    getSymbolFromChannel(channel) {
        return channel.split('_')[3] + "_" + channel.split('_')[4]
    }

    ping() {
        this.send({'event':'ping'})
    }
}

module.exports = OrderBookStreamOkex