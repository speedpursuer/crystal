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

  	describe('模拟测试交易所API', async function() {  		
    	it('查询账户、订单簿、下单、取消', async function() {  
    		global.realMode = true
    		global.realSim = false
    		var exchange = new Exchange('Poloniex', 'BCH', 'BTC', 1, 3)
    		await exchange.fetchAccount()
    		await exchange.fetchOrderBook()
    		// util.log(await exchange.limitBuy(0.1))
    		util.log(await exchange.limitSell(0.01))
    	})
  	})

	describe.only('真实测试交易所下单取消', async function() {  		
    	it('查询账户、订单簿、下单、取消', async function() {  
    		var base = 'BTC', quote = 'USD'
    		var buyPrice = 1
    		var sellPrice = 9000
    		var amount = 0.001
    		// var exchangeIDs = ['Bitfinex']
    		var exchangeIDs = ['hitbtc']

    		// var list = []
    		for(var id of exchangeIDs) {
    			var exchange = new Exchange(id, base, quote, 100, 2)
    			await exchange.testOrder(buyPrice, sellPrice, amount)
    			// list.push(exchange.testOrder(buyPrice, sellPrice, amount))
    		}
    		// await Promise.all(list)
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