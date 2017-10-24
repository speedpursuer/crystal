const ccxt = require ('ccxt')
const ExhangeSim = require ('./exchangeSim')
const exchangeInfo = require('../config/exchangeInfo.js')

const defaultSlippage = 0.001

class ExchangeFactory {
    createExchange(eid) {
        
        var id = eid.toLowerCase()
        var info = exchangeInfo[id]
        if(info) {
            let exchange = {}
            if(global.realMode) {
                exchange = new ccxt[id](info)                
            }else {
                exchange = new ExhangeSim(id, info, global.realSim||false, 0.75, 0.75)    
            }
            
            exchange.fee = info.fee
            exchange.fiat = info.fiat
            exchange.slippage = defaultSlippage
            exchange.nonce = function(){ return this.milliseconds () }            
            exchange.timeout = 20000
            return exchange
        }else{
            throw id + " 没有找到"
        }       
    }
}
var exchangeFactory = new ExchangeFactory()
module.exports = exchangeFactory;
