const _ = require('lodash')
const util = require ('../../util/util.js')
const TradeSim = require('./tradeSim')
const Trade = require('./trade')
const allConfig = require('../../config/tradeAllConfig')
const StreamService = require('../API/ws/streamService')

const Interval = 1000

class TradeAll{

    constructor(useSim=false) {
        this.useSim = useSim === 'sim'
    }

    async start() {
        await this.configSubTrades()
        await this.run()
    }

    async configSubTrades() {
        this.tradeList = []
        for(let name in allConfig) {
            let subTrade

            if(this.useSim) {
                let config = allConfig[name]
                let exchangesAccount = this.exchangesAccount(config.exchanges, config.initAccount)
                subTrade = new TradeSim(name, exchangesAccount)
            }else {
                subTrade = new Trade(name)
            }

            await subTrade.init()
            this.tradeList.push(subTrade)
        }
    }

    async run() {
        while(true) {
            await this.doTrade()
            await util.sleep(Interval)
        }
    }

    async doTrade() {
        let workingTrades = this.getWorkingTrades()
        if(workingTrades.length === 0) {
            throw new Error('All trades is stopped!')
        }
        for(let trade of workingTrades) {
            await trade.updateOrderBook()
            trade.strategy.findBestPair()
        }
        let bestTrade = _.maxBy(workingTrades, 'strategy.bestPoint')
        let strategy = bestTrade.strategy
        if(strategy.bestPoint > 0) {
            strategy.beforeTrade()
            await strategy.doHedge()
            strategy.afterTrade()
            await this.doBalance(bestTrade)
            await strategy.updateBalance()
            this.reportTotalProfit()
        }
    }

    async doBalance(trade) {
        let strategy = trade.strategy
        while(true) {
            await trade.updateOrderBook()
            strategy.beforeTrade()
            if(!await strategy.balance()) break
            strategy.afterTrade()
            await util.sleep(Interval)
        }
    }

    reportTotalProfit() {
        let totalProfit = _.sumBy(this.tradeList, function(o) { return o.strategy.currProfit })
        util.log.lightGray(`总盈利: ${totalProfit}`)
    }

    getWorkingTrades() {
        return _.filter(this.tradeList, function(trade) {
            return trade.strategy.condition
        })
    }

    exchangesAccount(exchanges, initAccount) {
        let exchangesAccount = {}
        for(let exchange of exchanges) {
            exchangesAccount[exchange] = initAccount
        }
        return exchangesAccount
    }
}
module.exports = TradeAll