const _ = require('lodash')
const util = require ('../../util/util.js')
const TradeBuilder = require('./tradeBuilder')
const AppLog = require('../db/appLog')
const StreamService = require('../stream/streamService')

const Interval = 2000

class Trade{
	constructor(tradeName, useStream=false, debug=true){
        this.useStream = useStream
        this.debug = debug
        this.tradeBuilder = new TradeBuilder(tradeName, debug)
		this.strategy = this.tradeBuilder.strategy
	}

	async init(){
		this.createExchanges()
		var list = await util.promiseFor(this.exchanges, 'fetchAccount')
		
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
		this.log(`******* 获取 ${list.length} 个交易所账户信息, 总钱: ${total.balance}, 总币: ${total.stocks} *******`)
		this.log(`*********************************************************`)
		this.log(`*********************************************************`)		

		await this.strategy.init(this.exchanges)
        await AppLog.instance.recordTrade(this.strategy.tradeLog.key)
        this.strategy.before()
	}

    createExchanges() {
        this.exchangesIDs = _.sortBy(_.map(this.tradeBuilder.exchanges, function(i) {return i.toLowerCase()}) )
        this.exchanges = this.tradeBuilder.buildExchanges(this.exchangesIDs, this.useStream)
    }

 	async updateOrderBook(){
        await util.promiseFor(this.exchanges, 'fetchOrderBook')
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
			if(this.useStream) {
				this.configStreams()
			}else {
                await this.loop()
			}
        }catch (e) {   
        	util.log.red("交易初始化失败，程序退出")     	
        	throw e
        }
	}

    configStreams() {
        let streamService = StreamService.instance, that = this
        streamService.on('started', function (isSuccess) {
            if(isSuccess) {
                util.log("stream started")
                that.loop().then
            }else {
                throw new Error('stream not started successfully')
            }
        })
        streamService.start()
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