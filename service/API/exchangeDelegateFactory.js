const ccxt = require ('ccxt')
const ExhangeSim = require ('./exchangeSim')
const ExchangeDelegate = require ('./exchangeDelegate')
const Bitfinex = require('./bitfinex')

const config = {
    failureInterval: 1000 * 60,
    failureThreshold: 1,
    retryDelay: 3 * 1000 * 60,
    retryInterval: 30 * 1000 * 60,
    retryThreshold: 1
}

const apis = { 
    bitfinex: Bitfinex
}

class ExchangeDelegateFactory {
    constructor() {
        this.exchangePoor = {}
        this.exchangeDelegateConfig = config
    }

    getExchangeDelegate(info, debug=false) {
        if(!this.exchangePoor[info.id]) {
            let api = apis[info.id]? new apis[info.id](info): new ccxt[info.id](info)
            api.interval = 200
            api.timeout = 20000
            api.nonce = function(){ return this.milliseconds () }
            this.exchangePoor[info.id] = this.createExchangeDelegate(api, debug)
        }
        return this.exchangePoor[info.id]
    }

    getExchangeDelegateSim(info, balance, realSim=false, debug=false) {
        if(!this.exchangePoor[info.id]) {
            let api = new ExhangeSim(info, balance, 0.75, 0.75, realSim)
            api.interval = 0
            this.exchangePoor[info.id] = this.createExchangeDelegate(api, debug)
            return this.exchangePoor[info.id]
        }else {
            let exchangeDelegate = this.exchangePoor[info.id]
            exchangeDelegate.api.addBalance(balance)
            return exchangeDelegate
        }
    }

    createExchangeDelegate(api, debug) {
        return new ExchangeDelegate(api, this.exchangeDelegateConfig, debug)
    }
}
var exchangeFactory = new ExchangeDelegateFactory()
module.exports = exchangeFactory
