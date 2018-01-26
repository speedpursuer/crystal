const _ = require('lodash')
const util = require ('../../util/util.js')
const TradeSim = require('./tradeSim')
const allConfig = require('../../config/tradeAllConfig')
const StreamService = require('../stream/streamService')

const Interval = 1000

class TradeAll{
    constructor(debug=true){
        this.debug = debug
    }

    async init() {
        this.tradeList = []
        for(let name in allConfig) {
            let config = allConfig[name]
            let exchangesAccount = this.exchangesAccount(config.exchanges, config.initAccount)
            let subTrade = new TradeSim(name, exchangesAccount, true, true)
            await subTrade.init()
            this.tradeList.push(subTrade)
        }
        this.configStreams()
    }

    configStreams() {
        let streamService = StreamService.instance, that = this
        streamService.on('started', function (isSuccess) {
            if(isSuccess) {
                util.log("stream started")
                that.run().then
            }else {
                throw new Error('stream not started successfully')
            }
        })
        streamService.start()
    }

    async run() {
        while(true) {
            await this.doTrade()
            await util.sleep(Interval)
        }
    }

    async doTrade() {
        for(let trade of this.tradeList) {
            await trade.updateOrderBook()
            trade.strategy.findBestPair()
        }
        let strategy = _.maxBy(this.tradeList, 'strategy.bestPoint').strategy
        if(strategy.bestPoint > 0) {
            strategy.beforeTrade()
            await strategy.doHedge()
            strategy.afterTrade()
            await this.doBalance(strategy)
            await strategy.updateBalance()
            this.reportTotalProfit()
        }
    }

    async doBalance(strategy) {
        while(true) {
            strategy.beforeTrade()
            if(!await strategy.balance()) break
            strategy.afterTrade()
            await util.sleep(Interval)
        }
    }

    reportTotalProfit() {
        let totalProfit = _.sumBy(this.tradeList, function(o) { return o.strategy.currProfit })
        util.log.magenta(`Total Profit: ${totalProfit}`)
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