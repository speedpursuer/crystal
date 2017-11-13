const ccxt = require ('ccxt')
const ExhangeSim = require ('./exchangeSim')
// const Bitfinex = require('./bitfinex')

import Bitfinex from './Bitfinex';
import ExchangeDelegate from './ExchangeDelegate';

const classes = { 
    bitfinex: Bitfinex
}

class ExchangeFactory {

    createExchange(info, crypto, fiat, initBalance, initStocks) {    
        if(!global.realMode) {
            exchange = new ExhangeSim(info, crypto, fiat, initBalance, initStocks, global.realSim||false, 1, 1)    
        }else if (classes[info.id]) {
            return new classes[info.id](info)
        }else {
            return new ExchangeDelegate(info)
        }
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
module.exports = exchangeFactory;
