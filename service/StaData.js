const _ = require('lodash')
const ProgressBar = require('progress')
const util = require('../util/util.js')
const database = require('../service/database.js')
const Arbitrage = require('../strategy/sta.js')
const Trade = require('../service/trade.js')

class Sta {
    constructor(start, end, debug=false) {
        this.start = util.timestampFromTime(start)
        this.end = util.timestampFromTime(end)
        this.debug = debug
    }

    async BTC() {
        var exchangeIDs = ['okex', 'huobipro']
        // var exchangeIDs = ['okex', 'huobipro', 'quoine', 'zb']
        await this.update(exchangeIDs, "BTC", "USD", 10, 10)
    }

    async update(exchangeIDs, base, quote, from=this.start, to=this.end||util.timestamp) {

        var trade = new Trade(exchangeIDs, new Arbitrage(base, quote), 1, 1, this.debug)
        await trade.init()

        var market = trade.strategy.fiat == 'USD'? trade.strategy.crypto: trade.strategy.market

        var timeline = await database.getOrderBooksTimeline(market, trade.exchangesIDs, from, to)
        timeline.sort(function(a, b){ return a - b})
        util.log.yellow(`---- 正在回测 - market: ${market}, exchanges: ${trade.exchangesIDs} 开始: ${util.timeFromTimestamp(_.head(timeline))}, 结束: ${util.timeFromTimestamp(_.last(timeline))} ----`)
        var orderBook = await database.getOrderBooks(market, trade.exchangesIDs, from, to)

        if(trade.strategy.before) {
            trade.strategy.before()
        }

        var bar = new ProgressBar(':bar', { total: timeline.length, clear: true})

        for(var time of timeline) {
            // if(this.debug) util.log(`******************************* 测试时间: ${util.timeFromTimestamp(time)} *******************************`)

            for(var id of trade.exchangesIDs) {
                var key = `${market}-${id}-${time}`
                if(orderBook[key]) {
                    trade.exchanges[id].orderBooks = orderBook[key]
                }else {
                    trade.exchanges[id].orderBooks = null
                }
            }

            await trade.strategy.doTrade(util.timeFromTimestamp(time))
            // await trade.strategy.updateBalance()

            if(!this.debug) bar.tick()
        }

        if(trade.strategy.after) {
            trade.strategy.after()
        }

        util.log.green("回测完成")
    }
}

let sta = new Sta("2017-12-08 11:14:40", null)
sta.BTC()

module.exports = Sta