const Exchange = require('../service/exchange.js')
const util = require('../util/util.js')
const ExchangeSim = require ('../service/exchangeSim.js')
const should = require('should');


describe.only('测试 ExchangeSim', async function() {

	

	before(async function() {
			
	})

	afterEach(async function(){
		
	})

  	describe('BTC/USD 下单，查询，查挂单', async function() {  		
    	it('订单状态和挂单数量一致', async function() {    	
    		var info = {      
	        	fee: 0.0016,
	        	fiat: 'USD'
	    	}
	
			var exchangeSim = new ExchangeSim('kraken', info, false, 1, 1)

      		var result = await exchangeSim.createLimitBuyOrder('BTC', 12, 3000)
      		should.exist(result.id)
						
			var order = await exchangeSim.fetchOrder(result.id)
			order.should.have.property('status')
			// order.status.should.equal('open').or.equal('closed')
			
			var orders = await exchangeSim.fetchOpenOrders()

			if(order.status == 'open') {
				orders.length.should.equal(1)
			}else {
				orders.length.should.equal(0)
			}			
    	})
  	})

  	describe.only('BTC/USD 下单', async function() {  		
    	it('账户信息一致', async function() {    	
    		var info = {      
	        	fee: 0.0016,
	        	fiat: 'USD'
	    	}
	
			var exchangeSim = new ExchangeSim('kraken', info, 'BTC', 'USD', false, 1, 1)

			await exchangeSim.fetchBalance()

      		var result = await exchangeSim.createLimitBuyOrder('BTC/USD', 0.2, 5700)
      		should.exist(result.id)					
			
			await exchangeSim.fetchBalance()
    	})
  	})

  	describe('LTC/BTC 下单', async function() {  		
    	it('账户信息一致', async function() {    	
    		var info = {      
	        	fee: 0.0016,
	        	fiat: 'USD'
	    	}
	
			var exchangeSim = new ExchangeSim('kraken', info, 'LTC', 'BTC', false, 1, 1)

			await exchangeSim.fetchBalance()

      		var result = await exchangeSim.createLimitBuyOrder('LTC/BTC', 0.2, 0.0096588)
      		should.exist(result.id)					
			
			await exchangeSim.fetchBalance()
    	})
  	})
})

