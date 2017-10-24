const should = require('should');
const Exchange = require('../service/exchange.js')
const util = require('../util/util.js')


describe('测试 exchange', async function() {	

	var list = ['Bitfinex', 'Poloniex', 'Bittrex']  
	var result = []	
	var exchanges = []

	this.timeout(50000)

	before(async function() {
		global.realMode = true

		for(var id of list) {		
			var exchange = new Exchange(id, "BTC", true)
			exchanges.push(exchange)
			result.push(exchange.testOrder())
		}
	})

	afterEach(async function(){
		
	})

  	describe('下单和取消', async function() {  		
    	it('后确保所有订单都取消', async function() {    		      		
      				
			await Promise.all(result)

			for(var exchange of exchanges) {		
				exchange.frozenBalance.should.equal(0)
				exchange.frozenStocks.should.equal(0)
			}
    	})
  	})
})