const ccxt = require ('ccxt')
const ExhangeSim = require ('./exchangeSim')
const ExchangeDelegate = require ('./exchangeDelegate')
const Bitfinex = require('./bitfinex')

const apis = { 
    bitfinex: Bitfinex
}

class ExchangeFactory {
    constructor() {
        this.exchangePoor = {}
    }

    createExchange(info, debug=false) {
        if(!this.exchangePoor[info.id]) {
            let api = apis[info.id]? new apis[info.id](info): new ccxt[info.id](info)
            api.interval = 200
            api.timeout = 20000
            api.nonce = function(){ return this.milliseconds () }
            this.exchangePoor[info.id] = new ExchangeDelegate(api, debug)
        }
        return this.exchangePoor[info.id]
    }

    createExchangeSim(info, crypto, fiat, initBalance, initStocks, realSim=false, debug=false) {
        let api = new ExhangeSim(info, crypto, fiat, initBalance, initStocks, realSim, 0.7, 0.7)
        api.interval = 0
        return new ExchangeDelegate(api, debug)
    }
}
var exchangeFactory = new ExchangeFactory()
module.exports = exchangeFactory
