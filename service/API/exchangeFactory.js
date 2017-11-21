const ccxt = require ('ccxt')
const ExhangeSim = require ('./exchangeSim')
const ExchangeDelegate = require ('./exchangeDelegate')
const Bitfinex = require('./Bitfinex')

const apis = { 
    bitfinex: Bitfinex
}

class ExchangeFactory {
    constructor() {
        this.exchangePoor = {}
    }

    createExchange(info, crypto, fiat, initBalance, initStocks, debug=false) {
        let api
        if(!global.realMode) {
            api = new ExhangeSim(info, crypto, fiat, initBalance, initStocks, global.realSim||false, 1, 1)
            api.interval = 0
            return new ExchangeDelegate(api, debug)
        }else {
            if(!this.exchangePoor[info.id]) {
                if (apis[info.id]) {
                    api = new apis[info.id](info)
                }else {
                    api = new ccxt[info.id](info)
                }
                api.interval = 200
                api.timeout = 20000
                api.nonce = function(){ return this.milliseconds () }
                this.exchangePoor[info.id] = new ExchangeDelegate(api, debug)
            }
            return this.exchangePoor[info.id]
        }
        // if(!this.exchangePoor[info.id]) {
        //     var api
        //     if(!global.realMode) {
        //         api = new ExhangeSim(info, crypto, fiat, initBalance, initStocks, global.realSim||false, 1, 1)
        //         api.interval = 0
        //     }else {
        //         if (apis[info.id]) {
        //             api = new apis[info.id](info)
        //         }else {
        //             api = new ccxt[info.id](info)
        //         }
        //         api.interval = 200
        //         api.timeout = 20000
        //         api.nonce = function(){ return this.milliseconds () }
        //     }
        //     this.exchangePoor[info.id] = new ExchangeDelegate(api, debug)
        // }
        // return this.exchangePoor[info.id]
    }
}
var exchangeFactory = new ExchangeFactory()
module.exports = exchangeFactory
