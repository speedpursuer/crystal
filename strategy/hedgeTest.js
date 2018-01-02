const util = require ('../util/util.js')
const Strategy = require('./baseStrategy.js')
const _ = require('lodash')


class HedgeTest extends Strategy {

    before() {
        this.maxAmountOnce = this.getConfig('maxAmountOnce')
        this.orderRate = this.getConfig('orderRate')
        this.minMargin = this.getConfig('minMargin')
    }
    
	async doTrade() {
        if(this.exchanges.length == 0) {
            this.log("无对冲数据，请检查配置")
        }else if(!await this.hedge()) {
            await this.balance()
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
            return true
        }
        return false
    }

    findPair(sellExchange, buyExchange) {
        if(sellExchange.buy1Price > buyExchange.sell1Price){

            var tradeAmount = Math.min(sellExchange.amountCanSell, buyExchange.amountCanBuy, sellExchange.buy1Amount * this.orderRate, buyExchange.sell1Amount * this.orderRate, this.maxAmountOnce)
            tradeAmount = this.adjustedTradeAmount(sellExchange, buyExchange, tradeAmount)
            var margin = sellExchange.earnForSellOne - buyExchange.payForBuyOne
            var profit = margin * tradeAmount
            var points = this.getPoints(profit, margin)

            // this.log(`findPair - sellExchange: ${sellExchange.id}, buyExchange: ${buyExchange.id}, profit: ${profit}, Earn: ${sellExchange.earnForSellOne}, Pay: ${buyExchange.payForBuyOne}, margin: ${margin}, tradeAmount: ${tradeAmount}`)

            if(sellExchange.canSellSuch(tradeAmount) &&
                buyExchange.canBuySuch(tradeAmount) &&
                margin > this.minMargin &&
                points > this.bestPair.points) {
                this.bestPair = {sellExchange, buyExchange, tradeAmount, profit, margin, points}
            }
        }
    }

    async balance() {
        if(this.stockDiff > 0) {
            var descList = _.orderBy(this.exchanges, 'earnForSellOne', 'desc')
            for(var exchange of descList) {
                var orderAmount = Math.min(this.stockDiff, exchange.amountCanSell, exchange.buy1Amount * this.orderRate, this.maxAmountOnce)
                if(exchange.canSellSuch(orderAmount)) {
                    this.action(`平衡: 存在币差 ${this.stockDiff}, ${exchange.id} 卖出 ${orderAmount} ${exchange.crypto}`)
                    await exchange.limitSell(orderAmount)
                    return true
                }
            }
        }else {
            var ascList = _.orderBy(this.exchanges, 'payForBuyOne', 'asc')
            for(var exchange of ascList) {
                var orderAmount = Math.min(Math.abs(this.stockDiff), exchange.amountCanBuy, exchange.sell1Amount * this.orderRate, this.maxAmountOnce)
                if(exchange.canBuySuch(orderAmount)) {
                    this.action(`平衡: 存在币差 ${this.stockDiff}, ${exchange.id} 买入 ${orderAmount} ${exchange.crypto}`)
                    await exchange.limitBuy(orderAmount)
                    return true
                }
            }
        }
        return false
    }

    getPoints(profit, margin) {
        return profit * 0.2 + margin * 0.8
    }

    adjustedTradeAmount(e1, e2, amount) {
        return _.floor(amount, Math.min(e1.precision, e2.precision))
    }
}
module.exports = HedgeTest