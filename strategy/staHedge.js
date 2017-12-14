const Hedge = require('./hedge.js')
const _ = require('lodash')

const maxAmountOnce = 2
const orderRate = 0.2
const rate = 2


class StaHedge extends Hedge {

    before() {
        var data = "{\"binance-bitfinex\":{\"posAvg\":-0.0001125677394445803,\"posStd\":0.0001267050871166656,\"negAvg\":-0.0002880522358086914,\"negStd\":0.00012878258730235546},\"binance-bittrex\":{\"posAvg\":-0.0002045961338738987,\"posStd\":0.00010853773743394589,\"negAvg\":-0.0002364670869218047,\"negStd\":0.00010084215262212727},\"binance-hitbtc\":{\"posAvg\":0.002387022360585304,\"posStd\":0.00017412110606910305,\"negAvg\":-0.0001748138004977342,\"negStd\":0.00011524868554904653},\"binance-huobipro\":{\"posAvg\":-0.00020845041594245975,\"posStd\":0.00009522122947425556,\"negAvg\":-0.000180314869708319,\"negStd\":0.00007999948729959624},\"binance-okex\":{\"posAvg\":-0.00012187912513327625,\"posStd\":0.00005854756009879864,\"negAvg\":-0.00013806714600563975,\"negStd\":0.000060204702160772825},\"bitfinex-bittrex\":{\"posAvg\":-0.0003509567342241931,\"posStd\":0.00012712073959561052,\"negAvg\":-0.000207627255334316,\"negStd\":0.00012201428007199094},\"bitfinex-hitbtc\":{\"posAvg\":0.002240769151370241,\"posStd\":0.00022868137896900817,\"negAvg\":-0.0001453463281677655,\"negStd\":0.00013174039687252658},\"bitfinex-huobipro\":{\"posAvg\":-0.00035448364847421595,\"posStd\":0.00014722593172602355,\"negAvg\":-0.0001517582734876743,\"negStd\":0.00014767594992827352},\"bitfinex-okex\":{\"posAvg\":-0.0002680136912684419,\"posStd\":0.00012128061085692379,\"negAvg\":-0.00010901199521943013,\"negStd\":0.00012053436159123614},\"bittrex-hitbtc\":{\"posAvg\":0.0022926036816003927,\"posStd\":0.00018904784395804713,\"negAvg\":-0.00023790820432551901,\"negStd\":0.00011533063570777664},\"bittrex-huobipro\":{\"posAvg\":-0.00030316398323700143,\"posStd\":0.00012926762433371715,\"negAvg\":-0.00024394969070964728,\"negStd\":0.00013284389466604747},\"bittrex-okex\":{\"posAvg\":-0.00021636478612033203,\"posStd\":0.00009868451764841204,\"negAvg\":-0.00020110716587325094,\"negStd\":0.00010849802188098006},\"hitbtc-huobipro\":{\"posAvg\":-0.00024087505496140735,\"posStd\":0.00014298010394072058,\"negAvg\":0.0023470043063457987,\"negStd\":0.00019308670722344674},\"hitbtc-okex\":{\"posAvg\":-0.00015500737367742624,\"posStd\":0.00011731852206146715,\"negAvg\":0.0023915053106277435,\"negStd\":0.00018828093672162554},\"huobipro-okex\":{\"posAvg\":-0.00016020980899058687,\"posStd\":0.00007823946865058089,\"negAvg\":-0.00020576226306217056,\"negStd\":0.00009115155362827049}}"
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