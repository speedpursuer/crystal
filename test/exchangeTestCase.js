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

  	describe.only('模拟测试交易所API', async function() {
    	it('查询账户、订单簿、下单、取消', async function() {  
    		global.realMode = true
    		global.realSim = false

            var base = 'BTC', quote = 'USD'
            var exchangeIDs = ['okex', 'huobipro', 'Quoine']

            for(var id of exchangeIDs) {
                var exchange = new Exchange(id, base, quote, 100, 2)
                await exchange.fetchAccount()
                await exchange.fetchOrderBook()
                util.log(exchange.sell1Price)
                util.log(exchange.buy1Price)
                // util.log(await exchange.limitBuy(0.1))
            }
    	})
  	})

	describe('BCH真实测试交易所下单取消', async function() {
    	it('查询账户、订单簿、下单、取消', async function() {  
    		var base = 'BCH', quote = 'BTC'
    		var buyPrice = 0.01
    		var sellPrice = 0.9
    		var amount = 0.083

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

    describe.only('BTC真实测试交易所下单取消', async function() {
        it('查询账户、订单簿、下单、取消', async function() {
            var base = 'BTC', quote = 'USD'
            var buyPrice = 1
            var sellPrice = 20000
            var amount = 0.01

            var exchangeIDs = ['huobipro']
            // var exchangeIDs = ['okex', 'huobipro', 'Quoine']

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