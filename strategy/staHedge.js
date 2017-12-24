const Hedge = require('./hedge.js')
const _ = require('lodash')

const maxAmountOnce = 1
const orderRate = 0.2
const rate = 2


class StaHedge extends Hedge {

    before() {
        var data = "{\"bitfinex-bittrex\":{\"posAvg\":-0.0000943483143942751,\"posStd\":0.00018610554761110996,\"negAvg\":-0.00007276994876443928,\"negStd\":0.00017191347021522761},\"bitfinex-hitbtc\":{\"posAvg\":-0.00007862165560756253,\"posStd\":0.00010065501220192463,\"negAvg\":-0.00005595967222563729,\"negStd\":0.00008850773578591357},\"bitfinex-okex\":{\"posAvg\":-0.000016804896653209144,\"posStd\":0.00007173506755250118,\"negAvg\":-0.00009894292916033036,\"negStd\":0.00008636260674306781},\"bitfinex-poloniex\":{\"posAvg\":-0.00009543122056724283,\"posStd\":0.00009658736786047892,\"negAvg\":-0.0000769025760521426,\"negStd\":0.00008352403923610972},\"bittrex-hitbtc\":{\"posAvg\":-0.00007211280754663452,\"posStd\":0.00014329787327361558,\"negAvg\":-0.00007302251497195902,\"negStd\":0.00014984430478202842},\"bittrex-okex\":{\"posAvg\":-0.000009302864796499162,\"posStd\":0.00019827888300324404,\"negAvg\":-0.00011729718664567542,\"negStd\":0.00021163174798947227},\"bittrex-poloniex\":{\"posAvg\":-0.00008854409065791569,\"posStd\":0.00014481665013948948,\"negAvg\":-0.00009369957179748965,\"negStd\":0.00015263534812476765},\"hitbtc-okex\":{\"posAvg\":0.0000058611135220006355,\"posStd\":0.00011651512771520773,\"negAvg\":-0.0001004007055587701,\"negStd\":0.00012812467685263427},\"hitbtc-poloniex\":{\"posAvg\":-0.00007301071080778101,\"posStd\":0.00004264326721565012,\"negAvg\":-0.00007720613778162322,\"negStd\":0.00004347325191430685},\"okex-poloniex\":{\"posAvg\":-0.00011694977462223259,\"posStd\":0.00012540736851354695,\"negAvg\":-0.000014811593591945124,\"negStd\":0.00011016646505760629}}"
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
        if((spread - mean) / std >= rate) {
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