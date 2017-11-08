const util = require ('../util/util.js')
const Strategy = require('./baseStrategy.js')
const _ = require('lodash')

const maxAmountOnce = 1
const orderRate = 0.2
const minMargin = 0.3

class Hedge extends Strategy {
    
	async doTrade() {		
        if(!await this.balance()) {
            await this.hedge()
        }        
	}

	async hedge() {
		this.bestPair = {magin: 0}

        for(var i in this.exchanges) {
            for(var j in this.exchanges) {
                if(i == j) continue
                this.findPair(this.exchanges[i], this.exchanges[j])
            }
        }

        if(this.bestPair.magin > 0) {
            this.action(`存在套利机会, ${this.bestPair.sellExchange.id} 卖, ${this.bestPair.buyExchange.id} 买, 差价: ${this.bestPair.magin}`)          
            await Promise.all([
                this.bestPair.buyExchange.limitBuy(this.bestPair.tradeAmount), 
                this.bestPair.sellExchange.limitSell(this.bestPair.tradeAmount),
                this.database.recordTrade(this.bestPair.sellExchange.id, this.bestPair.buyExchange.id, this.bestPair.tradeAmount, this.bestPair.magin/this.bestPair.tradeAmount)
            ])            
        }
    }

    findPair(sellExchange, buyExchange) {  
        if(sellExchange.buy1Price > buyExchange.sell1Price){

            var tradeAmount = Math.min(sellExchange.amountCanSell, buyExchange.amountCanBuy, sellExchange.buy1Amount * orderRate, buyExchange.sell1Amount * orderRate, maxAmountOnce)
            var magin = (sellExchange.earnForSellOne - buyExchange.payForBuyOne) * tradeAmount

            // this.log(`findPair - sellExchange: ${sellExchange.id}, buyExchange: ${buyExchange.id}, magin: ${magin}, Earn: ${sellExchange.earnForSellOne}, Pay: ${buyExchange.payForBuyOne}, Unit magin: ${sellExchange.earnForSellOne - buyExchange.payForBuyOne}, tradeAmount: ${tradeAmount}`)

            if(tradeAmount >= sellExchange.minTrade && 
                tradeAmount >= buyExchange.minTrade &&
                magin > minMargin/util.getExRate(this.fiat) && 
                magin > this.bestPair.magin) {
                this.bestPair = {sellExchange, buyExchange, tradeAmount, magin}
            }                                               
        }
    }

    async balance() {        
        if(this.stockDiff > 0) {
            var descList = _.orderBy(this.exchanges, 'earnForSellOne', 'desc')
            for(var exchange of descList) {
                var orderAmount = Math.min(this.stockDiff, exchange.amountCanSell, exchange.buy1Amount * orderRate, maxAmountOnce)
                if(orderAmount >= exchange.minTrade) {
                    this.action(`存在币差 ${this.stockDiff}, ${exchange.id} 卖出 ${orderAmount} ${exchange.crypto}`)                    
                    await exchange.limitSell(orderAmount)
                    return true
                }
            }
        }else {
            var ascList = _.orderBy(this.exchanges, 'payForBuyOne', 'asc')
            for(var exchange of ascList) {
                var orderAmount = Math.min(Math.abs(this.stockDiff), exchange.amountCanBuy, exchange.sell1Amount * orderRate, maxAmountOnce)                
                if(orderAmount >= exchange.minTrade) {
                    this.action(`存在币差 ${this.stockDiff}, ${exchange.id} 买入 ${orderAmount} ${exchange.crypto}`)
                    await exchange.limitBuy(orderAmount) 
                    return true
                }
            }
        }
        return false
    }
}
module.exports = Hedge