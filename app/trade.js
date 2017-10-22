const util = require ('../util/util.js')
const Exchange = require('../service/exchange.js')
const Interval = 2000

class Trade{
	constructor(ids, strategy){				
		this.strategy = strategy
		this.exchanges = {}
		for(var id of ids) {
			this.exchanges[id] = new Exchange(id, this.strategy.symbol, true)
		}		
	}

	init(){		
		return util.promiseFor(this.exchanges, 'getAccount')
		.then(list=>{
			util.log(`已获取 ${list.length} 个交易所得账户信息', `)
			this.strategy.init(this.exchanges)			
		})
		.catch(function(e){
			throw e
		})
	}

	updateOrderBook(){
		var now = (new Date()).getTime()
		return util.promiseFor(this.exchanges, 'fetchOrderBook')
		.then(list=>{
			util.log(`获取 ${list.length} 个交易数据，时间 ${(new Date()).getTime() - now} ms`)
		})
		.catch(function(e){
			throw e
		})
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
		// await this.loop()
	}

	async handleError(err) {
		util.log.bright.yellow(err)
		// var exchangeID = message.split(' ')[0]
		// util.log(this.exchanges[exchangeID])
		return util.sleep(Interval)
	}
}
module.exports = Trade