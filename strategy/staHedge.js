const Hedge = require('./hedge.js')
const _ = require('lodash')

const maxAmountOnce = 0.5
const orderRate = 0.2
const rate = 2


class StaHedge extends Hedge {

    before() {
        var data = "{\"huobipro-okex\":{\"posAvg\":-1115.7747453022994,\"posStd\":298.1306171492492,\"negAvg\":955.9923928541589,\"negStd\":297.3310018508511},\"huobipro-quoine\":{\"posAvg\":-765.9159572803655,\"posStd\":352.0559296177484,\"negAvg\":616.1587365381653,\"negStd\":354.0734999866304},\"huobipro-zb\":{\"posAvg\":-583.3755030642199,\"posStd\":249.47816308844952,\"negAvg\":440.21454444579507,\"negStd\":263.5214148124787},\"okex-quoine\":{\"posAvg\":283.66492344959096,\"posStd\":140.2294257178934,\"negAvg\":-406.17521768734326,\"negStd\":140.91062723078386},\"okex-zb\":{\"posAvg\":466.270049924148,\"posStd\":493.9650894762556,\"negAvg\":-582.2196732982842,\"negStd\":507.642287968175},\"quoine-zb\":{\"posAvg\":126.04821863152665,\"posStd\":557.4935389426164,\"negAvg\":-231.7832592482604,\"negStd\":566.548894314344}}"
        this.list = JSON.parse(data)
        // this.list = {
        //     'okex-huobipro': {
        //         posAvg: 837.0965246426841,
        //         posStd: 249.34844554795018,
        //         negAvg: -998.9420757534979,
        //         negStd: 249.25861632852528
        //     },
        //     'okex-quoine': {
        //         posAvg: 249.6230225848958,
        //         posStd: 205.10923824277418,
        //         negAvg: -376.0821610064171,
        //         negStd: 201.1102219447956
        //     },
        //     'okex-zb': {
        //         posAvg: 158.45310608732936,
        //         posStd: 488.12413623985753,
        //         negAvg: -272.4354142736466,
        //         negStd: 497.8167252649436
        //     },
        //     'huobipro-quoine': {
        //         posAvg: -683.5611966120493,
        //         posStd: 323.33982023618944,
        //         negAvg: 527.0448708678551,
        //         negStd: 321.6614392031978
        //     },
        //     'huobipro-zb': {
        //         posAvg: -774.4755116108801,
        //         posStd: 307.0591243053922,
        //         negAvg: 630.4346529543628,
        //         negStd: 313.90606125636526
        //     },
        //     'quoine-zb': {
        //         posAvg: -151.69903459982868,
        //         posStd: 489.0239222352083,
        //         negAvg: 43.13008836032132,
        //         negStd: 493.7925591239171
        //     },
        // }
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