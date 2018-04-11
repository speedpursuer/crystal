const _ = require('lodash')
const util = require ('../../util/util.js')
const TradeBuilder = require('./tradeBuilder')
const AppLog = require('../db/appLog')
const StreamService = require('../API/ws/streamService')

const Interval = 2000

class Trade{
	constructor(tradeName, debug=true){
        this.debug = debug
        this.tradeBuilder = new TradeBuilder(tradeName, debug)
		this.strategy = this.tradeBuilder.strategy
	}

	async init(){
		await this.initExchanges()
		await this.initBalance()
        await this.initPrices()
		await this.initStratege()
	}

	async initExchanges() {
        this.createExchanges()
        if(!await StreamService.instance.start()) {
            throw new Error('Stream not ready')
        }
    }

    createExchanges() {
        this.exchangesIDs = _.sortBy(_.map(this.tradeBuilder.exchanges, function(i) {return i.toLowerCase()}) )
        this.exchanges = this.tradeBuilder.buildExchanges(this.exchangesIDs)
    }

    async initBalance() {
        var list = await util.promiseFor(this.exchanges, 'fetchAccount')

        if(_.filter(list, function(o) { return (o.balance === 0 && o.stocks === 0) }).length > 0 ) {
            throw new Error("初始账户信息有误")
        }

        var total = _.reduce(list, function(result, value, key) {
            result.balance += value.balance
            result.stocks += value.stocks
            return result
        }, {balance: 0, stocks: 0})

        this.log(`*********************************************************`)
        this.log(`*********************************************************`)
        this.log(`******* 获取 ${list.length} 个交易所账户信息, 总钱: ${total.balance}, 总币: ${total.stocks} *******`)
        this.log(`*********************************************************`)
        this.log(`*********************************************************`)
	}

	async initPrices() {
        await this.updateOrderBook()
    }

	async initStratege() {
        await this.strategy.init(this.exchanges)
        await AppLog.instance.recordTrade(this.strategy.tradeLog.key)
        this.strategy.before()
	}

 	async updateOrderBook(){
        await util.promiseFor(this.exchanges, 'fetchOrderBook')
	}

	async loop(){
		while(this.strategy.condition) {
            try {            	
                await this.updateOrderBook()
                if(this.strategy.canTrade()) {
                    await this.strategy.doTrade()
                    await this.strategy.updateBalance()
                }
                await util.sleep(Interval)
            }catch (e) {
            	await this.handleError(e)
            }                    
        }
	}

	async run(){
		try {
            await this.init()
            await this.confirmation()
            await this.loop()
        }catch (e) {   
        	util.log.red("交易初始化失败，程序退出")     	
        	throw e
        }
	}

	async confirmation() {
	    util.log(`请确认配置，30秒后开始交易策略`)
        util.log(`-------------------------`)
        await util.sleep(30000)
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
module.exports = Trade