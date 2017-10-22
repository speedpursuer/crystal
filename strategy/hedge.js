const util = require ('../util/util.js')
const Strategy = require('./baseStrategy.js')
const minTrade = 0.002
const maxAmountOnce = 0.01
const orderRate = 0.5
const minMargin = 0.6

class Hedge extends Strategy {
    
	doTrade() {
		if(Math.abs(this.stockDiff) >= minTrade) {
            return this.balance()
        }else {
            return this.hedge()
        }
	}

	hedge() {
		this.bestPair = {magin: 0}

        for(var i in this.exchanges) {
            for(var j in this.exchanges) {
                if(i == j) continue
                this.findPair(this.exchanges[i], this.exchanges[j])
            }
        }

        if(this.bestPair.magin > 0) {
        	util.log(`存在套利机会, ${this.bestPair.sellExchange.id} 卖, ${this.bestPair.buyExchange.id} 买, 差价: ${this.bestPair.magin}`)
        	return Promise.all([
	    		this.bestPair.buyExchange.limitBuy(this.bestPair.tradeAmount), 
	    		this.bestPair.sellExchange.limitSell(this.bestPair.tradeAmount),
                this.database.recordTrade(this.bestPair.sellExchange.id, this.bestPair.buyExchange.id, this.bestPair.tradeAmount, this.bestPair.magin/this.bestPair.tradeAmount)
	    	])                                 
        }else {
        	util.log(`无套利机会`)
        }
    }

    findPair(sellExchange, buyExchange) {  

        if(sellExchange.buy1Price > buyExchange.sell1Price){

            var tradeAmount = Math.min(sellExchange.amountCanSell, buyExchange.amountCanBuy, sellExchange.buy1Amount * orderRate, buyExchange.sell1Amount * orderRate, maxAmountOnce)
            var magin = sellExchange.earnForSell(tradeAmount) - buyExchange.payForBuy(tradeAmount)

            // util.log("findPair", "magin:", magin, "Earn:", sellExchange.earnForSell(1), "Pay:", buyExchange.payForBuy(1), "Unit magin:", sellExchange.earnForSell(1) - buyExchange.payForBuy(1), "tradeAmount:", tradeAmount)                
            // util.log("bestPair.magin", this.bestPair.magin, tradeAmount, minTrade, magin, minMargin, minMargin/util.getExRate(this.fiat), this.fiat)

            if(tradeAmount >= minTrade && magin > minMargin/util.getExRate(this.fiat) && magin > this.bestPair.magin) {
                this.bestPair = {sellExchange, buyExchange, tradeAmount, magin}
            }                                               
        }
    }

    balance() {
    	var lowestBuyExchange
    	var highestSellExchange
    	for(let [id, exchange] of Object.entries(this.exchanges)){
			if(!lowestBuyExchange || lowestBuyExchange.sell1Price > exchange.sell1Price) {
                lowestBuyExchange = exchange
            }
            if(!highestSellExchange || highestSellExchange.buy1Price < exchange.buy1Price) {
                highestSellExchange = exchange
            }
		}		
        if(this.stockDiff > 0) {
        	var orderAmount = Math.min(this.stockDiff, highestSellExchange.amountCanSell, highestSellExchange.buy1Amount * orderRate)
        	if(orderAmount >= minTrade) {
                util.log(`存在币差 ${this.stockDiff}, ${highestSellExchange.id} 卖出 ${orderAmount} ${highestSellExchange.crypto}`)
        		return highestSellExchange.limitSell(orderAmount)	
        	}            
        }else{
        	var orderAmount = Math.min(Math.abs(this.stockDiff), lowestBuyExchange.amountCanBuy, lowestBuyExchange.sell1Amount * orderRate)
        	if(orderAmount >= minTrade) {
                util.log(`存在币差 ${this.stockDiff}, ${lowestBuyExchange.id} 买入 ${orderAmount} ${lowestBuyExchange.crypto}`)
        		return lowestBuyExchange.limitBuy(orderAmount)
        	}            
        }
    }
}
module.exports = Hedge