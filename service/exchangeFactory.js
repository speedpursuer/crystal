const ccxt = require ('ccxt')
const ExhangeSim = require ('./exchangeSim')
const exchangeInfo = require('../config/exchangeInfo.js')
const Bitfinex = require('./bitfinex')

class ExchangeFactory {
    createExchange(eid, crypto, fiat, initBalance, initStocks) {    
        var id = eid.toLowerCase()
        var info = exchangeInfo[id]
        
        if(!info) throw id + " 没有找到"        

        let exchange = {}
        if(global.realMode) {
            if(id == 'bitfinex') {
                exchange = new Bitfinex(info)
            }else {
                exchange = new ccxt[id](info)    
            }            
            exchange.fiat = info.fiat
            exchange.fee = info.fee   
            exchange.specialBuy = info.specialBuy             
            exchange.timeout = 20000
            exchange.nonce = function(){ return this.milliseconds () }
            exchange.delay = 200
        }else {                
            exchange = new ExhangeSim(id, info, crypto, fiat, initBalance, initStocks, global.realSim||false, 0.7, 0.7)    
            exchange.delay = 0
        }

        return exchange
    }
}
var exchangeFactory = new ExchangeFactory()
module.exports = exchangeFactory;
