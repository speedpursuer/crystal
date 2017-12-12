const util = require ('../util/util.js')
const Strategy = require('./baseStrategy.js')
const _ = require('lodash')
const math = require('mathjs')

const maxAmountOnce = 0.5
const orderRate = 0.2

class Sta extends Strategy {

    before() {
        this.posList = []
        this.negList = []
    }

    after() {
        // util.log(this.posList.length, this.negList.length)
    }

    async doTrade() {

        if(_.size(this.exchanges) != 2) return

        const posAvg = 141.810411872397
        const posStd = 190.37781386561332
        const posRate = _.ceil(-posAvg / posStd, 2)

        const negAvg = -262.87676815725695
        const negStd = 191.45540414064567
        const negRate = _.ceil(-negAvg / negStd, 2)

        var list = _.values(this.exchanges)

        var posDiff = list[0].earnForSellOne - list[1].payForBuyOne
        var negDiff = list[1].earnForSellOne - list[0].payForBuyOne

        if(posDiff - posAvg >= posStd) {
            await this.action(list[0], list[1], posDiff)
        }

        if(negDiff - negAvg >= negStd) {
            await this.action(list[1], list[0], negDiff)
        }
    }

    async action(sellExchange, buyExchange, diff) {
        var tradeAmount = Math.min(sellExchange.amountCanSell, buyExchange.amountCanBuy, sellExchange.buy1Amount * orderRate, buyExchange.sell1Amount * orderRate, maxAmountOnce)

        if(sellExchange.canSellSuch(tradeAmount) && buyExchange.canBuySuch(tradeAmount)) {
            var [buyResult, sellResult] = await Promise.all([
                buyExchange.limitBuy(tradeAmount),
                sellExchange.limitSell(tradeAmount)
            ])
            var margin = sellExchange.earnForSellOne - buyExchange.payForBuyOne
            await this.database.recordTrade(sellExchange.id, buyExchange.id, sellResult, buyResult, tradeAmount, margin)
        }
    }
}
module.exports = Sta