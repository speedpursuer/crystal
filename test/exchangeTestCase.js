const should = require('should');
const Exchange = require('../service/exchange.js')
const util = require('../util/util.js')


describe.only('测试 exchange', async function() {	

	this.timeout(50000)

	before(async function() {
		global.realMode = true
	})

	afterEach(async function(){
		
	})

	describe('测试交易所API', async function() {  		
    	it('下现价单', async function() {  
    		var exchange = new Exchange('okex', 'BCH', 'BTC')
    		await exchange.fetchAccount()
    		await exchange.fetchOrderBook()    		
    		// await exchange.limitBuy(0.1)
    		// await exchange.limitSell(0.1)
    		// await util.sleep(5000)
    		// await exchange.fetchAccount()
    	})
  	})

	describe.only('测试交易所API', async function() {  		
    	it('查询账户、订单簿、下单、取消', async function() {  

    		var base = 'BCH', quote = 'BTC'
    		var buyPrice = 0.01
    		var sellPrice = 4900
    		var amount = 0.1
    		var exchangeIDs = ['okex', 'hitbtc']

    		var list = []
    		for(var id of exchangeIDs) {
    			var exchange = new Exchange(id, base, quote)
    			list.push(exchange.testOrder(buyPrice, sellPrice, amount))
    		}
    		await Promise.all(list)
    	})
  	})

  	describe('下单和取消', async function() {  		
    	it('后确保所有订单都取消', async function() {  

    		var list = ['Bitfinex', 'Poloniex', 'Bittrex']  
			var result = []	
			var exchanges = []  	

			for(var id of list) {		
				var exchange = new Exchange(id, "BTC", true)
				exchanges.push(exchange)
				result.push(exchange.testOrder())
			}	      		
      				
			await Promise.all(result)

			for(var exchange of exchanges) {		
				exchange.frozenBalance.should.equal(0)
				exchange.frozenStocks.should.equal(0)
			}
    	})
  	})

  	describe('获取市场深度', async function() {  		
    	it('返回数量压缩不超过5', async function() {   
    		// ['Bitfinex', 'Poloniex', 'Bittrex', 'Bitstamp', 'okcoinusd']   		      		
    		var exchange = new Exchange('bitstamp', "BTC", true)
    		var orderBook = await exchange.fetchOrderBook()
    		util.log(orderBook)		
    		orderBook.bids.length.should.not.be.above(5)
    		orderBook.asks.length.should.not.be.above(5)
    	})
  	})
})