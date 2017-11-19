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

    createExchange(info, crypto, fiat, initBalance, initStocks) { 
        if(!this.exchangePoor[info.id]) {         
            var api
            if(!global.realMode) {
                api = new ExhangeSim(info, crypto, fiat, initBalance, initStocks, global.realSim||false, 1, 1)    
            }else {
                if (apis[info.id]) {
                    api = new apis[info.id](info)
                }else {
                    api = new ccxt[info.id](info)        
                }
                api.timeout = ApiTimeout
                api.nonce = function(){ return this.milliseconds () }    
            }
            this.exchangePoor[info.id] = new ExchangeDelegate(api)
        }
        return this.exchangePoor[info.id]

        // var exchangeDelegate = {}
        // if(!global.realMode) {
        //     exchangeDelegate = new ExhangeSim(info, crypto, fiat, initBalance, initStocks, global.realSim||false, 1, 1)    
        // }else {
        //     exchangeDelegate = new ExchangeDelegate(info)            
        // }
        // return exchangeDelegate
    }

    // createExchange(eid, crypto, fiat, initBalance, initStocks) {    
    //     var id = eid.toLowerCase()
    //     var info = exchangeInfo[id]
        
    //     if(!info) throw id + " 没有找到"        

    //     let exchange = {}
    //     if(global.realMode) {
    //         if(id == 'bitfinex') {
    //             exchange = new Bitfinex(info)
    //         }else {
    //             exchange = new ccxt[id](info)    
    //         }            
    //         exchange.fiat = info.fiat
    //         exchange.fee = info.fee   
    //         exchange.specialBuy = info.specialBuy             
    //         exchange.minTrade = info.minTrade
    //         exchange.timeout = 20000
    //         exchange.nonce = function(){ return this.milliseconds () }
    //         exchange.delay = 200
    //     }else {                
    //         exchange = new ExhangeSim(id, info, crypto, fiat, initBalance, initStocks, global.realSim||false, 1, 1)    
    //         exchange.delay = 0
    //     }
        
    //     return exchange
    // }
}
var exchangeFactory = new ExchangeFactory()
module.exports = exchangeFactory
