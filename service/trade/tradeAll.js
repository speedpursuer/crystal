const _ = require('lodash')
const util = require ('../../util/util.js')
const TradeAllBuilder = require('./tradeAllBuilder')
const StreamService = require('../stream/streamService')

const Interval = 2000

class TradeAll{
    constructor(debug=true){
        this.debug = debug
        this.tradeBuilder = new TradeAllBuilder(false)
        this.strategy = this.tradeBuilder.strategy
    }

    async init(){
        this.createExchanges()
        await this.getAllInitBalances()
        await this.strategy.init(this.exchangeSet)
        this.strategy.before()
        this.setUpStream()
    }

    setUpStream() {
        let that = this
        this.streamService = new StreamService(this.exchangesById)
        this.streamService.on('started', function (isSuccess) {
            if(isSuccess) {
                that.updateOrderBook().then()
            }else {
                throw new Error('stream not started successfully')
            }
        })
        this.streamService.start()
    }

    async createExchanges() {
        this.exchangeSet = this.tradeBuilder.buildAllExchanges()
        this.exchangesById = this.tradeBuilder.buildExchangesById(this.exchangeSet)
    }

    async getAllInitBalances() {
        for(let symbol in this.exchangeSet) {
            await this.getInitBalances(symbol, this.exchangeSet[symbol])
        }
    }

    async getInitBalances(symbol, exchanges) {
        var list = await util.promiseFor(exchanges, 'fetchAccount')
        if(_.filter(list, function(o) { return (o.balance == 0 && o.stocks == 0) }).length > 0 ) {
            throw new Error("初始账户信息有误")
        }
        var total = _.reduce(list, function(result, value, key) {
            result.balance += value.balance
            result.stocks += value.stocks
            return result
        }, {balance: 0, stocks: 0})
        this.log(`*********************************************************`)
        this.log(`*********************************************************`)
        this.log(`******* 交易对 ${symbol} 获取 ${list.length} 个交易所账户信息, 总钱: ${total.balance}, 总币: ${total.stocks} *******`)
        this.log(`*********************************************************`)
        this.log(`*********************************************************`)
    }

    async updateOrderBook(){
        for(let id in this.exchangesById) {
            let exchanges = this.exchangesById[id]
            for(let symbol in exchanges) {
                let exchange = exchanges[symbol]
                exchange.ob = this.streamService.getOrderbook(id, symbol)
            }
        }
    }

    async loop(){
        while(this.strategy.condition) {
            try {
                await this.updateOrderBook()
                await this.strategy.doTrade()
                await this.strategy.updateBalance()
                await util.sleep(Interval)
            }catch (e) {
                await this.handleError(e)
            }
        }
    }

    async run(){
        try {
            await this.init()
        }catch (e) {
            util.log.red("交易初始化失败，程序退出")
            throw e
        }
        // await this.loop()
    }

    async handleError(err) {
        util.log.bright.yellow(err)
        // var exchangeID = message.split(' ')[0]
        // util.log(this.exchanges[exchangeID])
        return util.sleep(Interval)
    }

    log(message) {
        if(this.debug) util.log(message)
    }
}
module.exports = TradeAll