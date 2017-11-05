const util = require ('../util/util.js')
const Exchange = require('../service/exchange.js')
const _ = require('lodash')
const Interval = 2000

class Trade{
	constructor(ids, strategy, initBalance, initStocks, debug=true){				
		this.debug = debug
		this.strategy = strategy
		this.exchangesIDs = _.map(ids, function(i) {return i.toLowerCase()})
		this.exchanges = {}
		for(var id of this.exchangesIDs) {
			this.exchanges[id] = new Exchange(id, this.strategy.crypto, this.strategy.fiat, initBalance, initStocks, this.debug)
		}
	}

	async init(){		
		var list = await util.promiseFor(this.exchanges, 'fetchAccount')
		this.log(`已获取 ${list.length} 个交易所得账户信息', `)
		await this.strategy.init(this.exchanges)
	}

 	async updateOrderBook(){
		var start = (new Date()).getTime()
		var list = await util.promiseFor(this.exchanges, 'fetchOrderBook')		
		var lag = (new Date()).getTime() - start
		this.log(`获取 ${list.length} 个交易数据，时间 ${lag} ms`)	
		if(lag > 2000) {
			throw '超时，跳过本轮'
		}
	}

	async loop(){
		while(this.strategy.condition) {
            try {  
            	util.log("******************************************************")                                            
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