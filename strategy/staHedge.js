const Hedge = require('./hedge.js')
const _ = require('lodash')

const maxAmountOnce = 1
const orderRate = 0.1
const rate = 2


class StaHedge extends Hedge {

    before() {
        var data = "{\"binance-bitfinex\":{\"posAvg\":-0.001456818515422717,\"posStd\":0.0005287344405383319,\"negAvg\":-0.0005634407486586694,\"negStd\":0.00044538231383919197}}"
        this.list = JSON.parse(data)
        this.log(this.list)
    }

    async doTrade() {
        this.reset()
        if(this.exchanges.length == 0) {
            this.log("无对冲数据，请检查配置")
        }else if(!await this.balance()) {
            await this.hedge()
        }
    }

    async hedge() {
        var list = _.values(this.exchanges)

        for(var i=0; i<list.length; i++) {
            for(var j=i+1; j<list.length; j++) {
                this.computeHedge(list[i], list[j])
            }
        }
        await Promise.all(this.actions)
    }

    computeHedge(e1, e2) {
        var posDiff = e1.earnForSellOne - e2.payForBuyOne
        var negDiff = e2.earnForSellOne - e1.payForBuyOne

        let data = this.list[`${e1.id}-${e2.id}`]

        if(this.isSpreaded(posDiff, data.posAvg, data.posStd)) {
            this.willHedge(e1, e2)
        }else if(this.isSpreaded(negDiff, data.negAvg, data.negStd)) {
            this.willHedge(e2, e1)
        }
    }

    willHedge(sellExchange, buyExchange) {
        var tradeAmount = Math.min(sellExchange.amountCanSell, buyExchange.amountCanBuy, sellExchange.buy1Amount * orderRate, buyExchange.sell1Amount * orderRate, maxAmountOnce)
        if(sellExchange.canSellSuch(tradeAmount) && buyExchange.canBuySuch(tradeAmount) && this.canTrade(sellExchange, buyExchange)) {
            this.actions.push(this.performHedge(sellExchange, buyExchange, tradeAmount))
            this.setTrade(sellExchange, buyExchange)
        }
    }

    async performHedge(sellExchange, buyExchange, tradeAmount) {
        var margin = sellExchange.earnForSellOne - buyExchange.payForBuyOne
        this.action(`对冲: 存在套利机会, ${sellExchange.id} 卖, ${buyExchange.id} 买, 收益: ${tradeAmount * margin}, 差价: ${margin}`)
        var [buyResult, sellResult] = await Promise.all([
            buyExchange.limitBuy(tradeAmount),
            sellExchange.limitSell(tradeAmount)
        ])
        await this.database.recordTrade(sellExchange.id, buyExchange.id, sellResult, buyResult, tradeAmount, margin)
    }

    isSpreaded(spread, mean, std) {

        // var rt = Math.max(-mean / std, rate)

        var rt = rate

        if((spread - mean) / std >= rt) {
            return true
        }
        return false
    }

    reset() {
        this.actions = []
        this.pairs = this.defaultPairs
    }

    get defaultPairs() {
        let pairs = {}
        _.each(this.exchanges, function (value) {
            pairs[value.id] = {
                sell: false,
                buy: false
            }
        })
        return pairs
    }

    canTrade(sellExchange, buyExchange) {
        if(this.pairs[sellExchange.id].sell || this.pairs[buyExchange.id].buy) {
            return false
        }
        return true
    }

    setTrade(sellExchange, buyExchange) {
        this.pairs[sellExchange.id].sell = true
        this.pairs[buyExchange.id].buy = true
    }
}
module.exports = StaHedge