const _ = require('lodash')
const util = require ('../util/util.js')
const Exchange = require('./exchange.js')
const TradeConfig = require('../config/tradeConfig')

const Interval = 2000

class Trade{
	constructor(tradeName, exchangeIDs, initBalance, initStocks, debug=true){
        let tradeConfig = new TradeConfig(tradeName)
		this.strategy = tradeConfig.strategy
		this.exchangesIDs = _.sortBy(_.map(exchangeIDs? exchangeIDs: tradeConfig.exchanges, function(i) {return i.toLowerCase()}) )
		this.exchanges = {}
		for(var id of this.exchangesIDs) {
			this.exchanges[id] = new Exchange(tradeConfig.exchangeInfo(id), this.strategy.crypto, this.strategy.fiat, initBalance, initStocks, debug)
		}
        this.debug = debug
	}

	async init(){		
		var list = await util.promiseFor(this.exchanges, 'fetchAccount')
		
		if(_.filter(list, function(o) { return (o.balance == 0 && o.stocks == 0) }).length > 0 ) {
			throw "初始账户信息有误"
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
        this.strategy.before()
	}

 	async updateOrderBook(){
        await util.promiseFor(this.exchanges, 'fetchOrderBook')
		// var start = (new Date()).getTime()
		// var list = await util.promiseFor(this.exchanges, 'fetchOrderBook')
		// var lag = (new Date()).getTime() - start
		// this.log(`获取 ${_.filter(list, function(o) { return o!=null }).length} 个交易数据，时间 ${lag} ms`)	
		// if(lag > 1500) {
		// 	throw '超时，跳过本轮'
		// }
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
		await this.loop()
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