const util = require ('../util/util.js')
const Exchange = require('../service/exchange.js')
const database = require('../service/database.js')
const _ = require('lodash')
const Interval = 2000

class Trade{
	constructor(ids, strategy){				
		this.strategy = strategy
		this.exchangesIDs = _.map(ids, function(i) {return i.toLowerCase()})
		this.exchanges = {}
		for(var id of this.exchangesIDs) {
			this.exchanges[id] = new Exchange(id, this.strategy.crypto, true)
		}
	}

	async init(){		
		var list = await util.promiseFor(this.exchanges, 'fetchAccount')
		util.log(`已获取 ${list.length} 个交易所得账户信息', `)
		await this.strategy.init(this.exchanges)	
	}

 	async updateOrderBook(){
		var start = (new Date()).getTime()
		var list = await util.promiseFor(this.exchanges, 'fetchOrderBook')
		util.log(`获取 ${list.length} 个交易数据，时间 ${(new Date()).getTime() - start} ms`)	
	}

	async loop(){
		while(this.strategy.condition()) {
            try {  
            	util.log("******************************************************")                                            
                await this.updateOrderBook()                
                await this.strategy.doTrade()
                await this.strategy.reportBalance()                                          
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

	async backtest() {
		try { 
			await this.init()
			var timeline = await database.getOrderBooksTimeline('1509021522000', '1509021545000')
			timeline.sort(function(a, b){ return a - b})
			for(var time of timeline) {				
				var orderBook = await database.getOrderBooks1(this.exchangesIDs, time)
				var skip = false
				for(var id of this.exchangesIDs) {
					if(orderBook[id]) {
						this.exchanges[id].orderBooks = orderBook[id]
					}else{
						skip = true
						break
					}					
				}
				if(skip) continue
				util.log.yellow(`******************************* 测试时间: ${util.timeFromTimestamp(time)} *******************************`)
				await this.strategy.doTrade()
                await this.strategy.reportBalance()                                          
			}
			util.log.green("回测完成")			
			process.exit()
        }catch (e) {   
        	util.log.red(e)     	
        	throw e
        }
	}
}
module.exports = Trade