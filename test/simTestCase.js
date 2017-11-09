const Exchange = require('../service/exchange.js')
const util = require('../util/util.js')
const ExchangeSim = require ('../service/exchangeSim.js')
const should = require('should');


describe('测试 ExchangeSim', async function() {
	
	before(async function() {
			
	})

	afterEach(async function(){
		
	})

	describe('测试不同买单模式', async function() {  		
    	it('余额变化情况', async function() {    	
    		var info = {      
	        	fee: 0.001,
	        	fiat: 'USD',
	        	specialBuy: true
	    	}

			var exchangeSim = new ExchangeSim('hitbtc', info, 'BCH', 'BTC', 0.015710202, 5.624, false, 0.1, 0.1, true)

			await exchangeSim.fetchBalance()

      		var result = await exchangeSim.createLimitBuyOrder('BCH', 0.01, 0.08467800)
      		should.exist(result.id)

      		await exchangeSim.fetchBalance()
					
      		await exchangeSim.cancelOrder(result.id)

      		await exchangeSim.fetchBalance()

      		util.log("-------------------------------------")

			info = {      
	        	fee: 0.0025,
	        	fiat: 'USD',
	    	}	

	    	exchangeSim = new ExchangeSim('poloniex', info, 'BCH', 'BTC', 0.30678142, 0.8590725, false, 1, 1, true)

			await exchangeSim.fetchBalance()

      		var result = await exchangeSim.createLimitBuyOrder('BCH', 2, 0.08524900)
      		should.exist(result.id)

      		await exchangeSim.fetchBalance()

      		util.log("-------------------------------------")

      		info = {      
	        	fee: 0.001,
	        	fiat: 'USD',
	    	}	

	    	exchangeSim = new ExchangeSim('okex', info, 'BCH', 'BTC', 0.5859375, 8.426966292134832, false, 1, 1, true)

			await exchangeSim.fetchBalance()

      		var result = await exchangeSim.createLimitBuyOrder('BCH', 0.4, 0.07387716)
      		should.exist(result.id)

      		await exchangeSim.fetchBalance()

      		await exchangeSim.cancelOrder(result.id)

      		await exchangeSim.fetchBalance()

      		util.log("-------------------------------------")

      		info = {      
	        	fee: 0.0025,
	        	fiat: 'USD',
	        	specialBuy: true
	    	}	

	    	exchangeSim = new ExchangeSim('bittrex', info, 'BCH', 'BTC', 0.34214941, 0.02, false, 1, 1, true)

			await exchangeSim.fetchBalance()

      		var result = await exchangeSim.createLimitSellOrder('BCH', 0.01, 0.07612000)

      		await exchangeSim.fetchBalance()
    	})
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

  	describe('BTC/USD 下单', async function() {  		
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

