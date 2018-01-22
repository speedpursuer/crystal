const _ = require('lodash')
const util = require ('../../util/util.js')
const TradeSim = require('../trade/tradeSim')
const allConfig = require('../../config/tradeAllConfig')
const StreamService = require('../streamService')

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
            let subTrade = new TradeSim(name, exchangesAccount, true)
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

    exchangesAccount(exchanges, initAccount) {
        let exchangesAccount = {}
        for(let exchange of exchanges) {
            exchangesAccount[exchange] = initAccount
        }
        return exchangesAccount
    }

    async run() {
        while(true) {
            await this.findBest()
            await util.sleep(Interval)
        }
    }

    async findBest() {
        // let best = []
        for(let trade of this.tradeList) {
            await trade.updateOrderBook()
            trade.strategy.findBestPair()
            // if(result.points != 0) {
            //     trade.strategy.printHedgeInfo()
            // }
        }
        let bestTrade = _.maxBy(this.tradeList, 'strategy.bestPoint')
        if(bestTrade.strategy.bestPoint > 0) {
            await bestTrade.strategy.doHedge()
            await this.doBalance(bestTrade.strategy)
        }
    }

    async doBalance(strategy) {
        while(true) {
            await strategy.updateBalance()
            if(!await strategy.balance()) {
                break
            }
            await util.sleep(Interval)
        }
    }
}
module.exports = TradeAll