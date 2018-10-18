const BaseStream =require('./baseStream')
const util = require('../../../util/util')
const _ = require('lodash')
const pako = require('pako')

class StreamOkex extends BaseStream {

    start() {
        let data = []
        for (let symbol of this.realSymbols) {
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

    parseMessage(msg) {
        return super.parseMessage(pako.inflateRaw(msg, {
            to: 'string'
        }))
    }

    parseData(msg) {
        return msg[0]
    }

    getSymbolFromChannel(channel) {
        let symbol = channel.split('_')[3] + "_" + channel.split('_')[4]
        return symbol.toLowerCase()
    }

    ping() {
        this.send({'event':'ping'})
    }
}

module.exports = StreamOkex