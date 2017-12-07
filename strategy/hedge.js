const util = require ('../util/util.js')
const Strategy = require('./baseStrategy.js')
const _ = require('lodash')

const maxAmountOnce = 1
const orderRate = 0.2
const minMargin = 0.00001
const stockLeft = 0


class Hedge extends Strategy {
    
	async doTrade() {
        if(this.exchanges.length == 0) {
            this.log("无对冲数据，请检查配置")
        }else if(!await this.balance()) {
            await this.hedge()
        }
	}

    async hedge() {
        this.bestPair = {points: 0}

        for(var i in this.exchanges) {
            for(var j in this.exchanges) {
                if(i == j) continue
                this.findPair(this.exchanges[i], this.exchanges[j])
            }
        }

        if(this.bestPair.points > 0) {
            this.action(`对冲: 存在套利机会, ${this.bestPair.sellExchange.id} 卖, ${this.bestPair.buyExchange.id} 买, 收益: ${this.bestPair.profit}, 差价: ${this.bestPair.margin}`)
            var [buyResult, sellResult] = await Promise.all([
                this.bestPair.buyExchange.limitBuy(this.bestPair.tradeAmount),
                this.bestPair.sellExchange.limitSell(this.bestPair.tradeAmount)
            ])
            await this.database.recordTrade(this.bestPair.sellExchange.id, this.bestPair.buyExchange.id, sellResult, buyResult, this.bestPair.tradeAmount, this.bestPair.margin)
        }
    }

    findPair(sellExchange, buyExchange) {
        if(sellExchange.buy1Price > buyExchange.sell1Price){

            var tradeAmount = Math.min(this.maxAmountCanSell(sellExchange), buyExchange.amountCanBuy, sellExchange.buy1Amount * orderRate, buyExchange.sell1Amount * orderRate, maxAmountOnce)
            var margin = sellExchange.earnForSellOne - buyExchange.payForBuyOne
            var profit = margin * tradeAmount
            var points = this.getPoints(profit, margin)

            // this.log(`findPair - sellExchange: ${sellExchange.id}, buyExchange: ${buyExchange.id}, profit: ${profit}, Earn: ${sellExchange.earnForSellOne}, Pay: ${buyExchange.payForBuyOne}, margin: ${margin}, tradeAmount: ${tradeAmount}`)

            if(sellExchange.canSellSuch(tradeAmount) &&
                buyExchange.canBuySuch(tradeAmount) &&
                margin > minMargin &&
                points > this.bestPair.points) {
                this.bestPair = {sellExchange, buyExchange, tradeAmount, profit, margin, points}
            }
        }
    }

    getPoints(profit, margin) {
        return profit * 0.2 + margin * 0.8
    }

    async balance() {        
        if(this.stockDiff > 0) {
            var descList = _.orderBy(this.exchanges, 'earnForSellOne', 'desc')
            for(var exchange of descList) {
                var orderAmount = Math.min(this.stockDiff, this.maxAmountCanSell(exchange), exchange.buy1Amount * orderRate, maxAmountOnce)
                if(exchange.canSellSuch(orderAmount)) {
                    this.action(`平衡: 存在币差 ${this.stockDiff}, ${exchange.id} 卖出 ${orderAmount} ${exchange.crypto}`)
                    await exchange.limitSell(orderAmount)
                    return true
                }
            }
        }else {
            var ascList = _.orderBy(this.exchanges, 'payForBuyOne', 'asc')
            for(var exchange of ascList) {
                var orderAmount = Math.min(Math.abs(this.stockDiff), exchange.amountCanBuy, exchange.sell1Amount * orderRate, maxAmountOnce)                
                if(exchange.canBuySuch(orderAmount)) {
                    this.action(`平衡: 存在币差 ${this.stockDiff}, ${exchange.id} 买入 ${orderAmount} ${exchange.crypto}`)
                    await exchange.limitBuy(orderAmount)
                    return true
                }
            }
        }
        return false
    }

    maxAmountCanSell(exchange) {
	    return Math.max(exchange.amountCanSell - stockLeft, 0)
    }

    // async buyCoin() {
    //     if(this.avgPrice < 0.11) {
    //         var totalBalance = this.avgPrice * this.currStock + this.currBalance
    //         if(this.currBalance/totalBalance  > 0.6) {
    //             // await this.buyLowest("买入BCH", )
    //         }
    //     }
    // }
    //
    // async sellHighest(message, amount) {
    //     var descList = _.orderBy(this.exchanges, 'earnForSellOne', 'desc')
    //     for(var exchange of descList) {
    //         var orderAmount = Math.min(amount, exchange.amountCanSell, exchange.buy1Amount * orderRate, maxAmountOnce)
    //         if(orderAmount >= exchange.minTrade) {
    //             this.action(`${message}, ${exchange.id} 卖出 ${orderAmount} ${exchange.crypto}`)
    //             await exchange.limitSell(orderAmount)
    //             return true
    //         }
    //     }
    //     return false
    // }
    //
    // async buyLowest(message, amount) {
    //     var ascList = _.orderBy(this.exchanges, 'payForBuyOne', 'asc')
    //     for(var exchange of ascList) {
    //         var orderAmount = Math.min(amount, exchange.amountCanBuy, exchange.sell1Amount * orderRate, maxAmountOnce)
    //         if(orderAmount >= exchange.minTrade) {
    //             this.action(`${message}, ${exchange.id} 买入 ${orderAmount} ${exchange.crypto}`)
    //             await exchange.limitBuy(orderAmount)
    //             return true
    //         }
    //     }
    //     return false
    // }
}
module.exports = Hedge