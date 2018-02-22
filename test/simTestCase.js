const util = require('../util/util.js')
const ExchangeSim = require ('../service/API/class/exchangeSim.js')
const should = require('should');


describe('测试 ExchangeSim', async function() {

	before(async function() {
			
	})

	afterEach(async function(){
		
	})

	describe('测试不同买单模式', async function() {  		
    	it('余额变化情况', async function() {    	
    		var info = {
    			id: 'hitbtc',
	        	fee: 0.001,
	        	fiat: 'USD',
	        	specialBuy: true,
	    	}

	    	let	balance = {
                BTC: 10,
                ETH: 20,
                EOS: 100,
                BCH: 50,
            }

			var exchangeSim = new ExchangeSim(info, balance, 0.1, 0.1, false, true)

			await exchangeSim.fetchBalance()

      		var result = await exchangeSim.createLimitBuyOrder('BCH/BTC', 0.01, 0.01)
      		should.exist(result.id)

      		await exchangeSim.fetchBalance()
					
      		await exchangeSim.cancelOrder(result.id, 'BCH/BTC')

      		await exchangeSim.fetchBalance()

      		util.log("-------------------------------------")

			info = {
	        	fee: 0.0025,
	        	fiat: 'USD',
				id: 'poloniex'
            }

            exchangeSim = new ExchangeSim(info, balance, 1, 1, false, true)

			await exchangeSim.fetchBalance()

      		var result = await exchangeSim.createLimitSellOrder('EOS/BTC', 2, 0.001)
      		should.exist(result.id)

      		await exchangeSim.fetchBalance()
    	})
  	})
})

