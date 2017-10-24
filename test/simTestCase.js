const Exchange = require('../service/exchange.js')
const util = require('../util/util.js')
const ExchangeSim = require ('../service/exchangeSim.js')
const should = require('should');


describe.only('测试 ExchangeSim', async function() {

	var info = {      
        	fee: 0.0016,
        	fiat: 'USD'
    	}
	
	var exchangeSim = new ExchangeSim('kraken', info, false, 1, 1)

	before(async function() {
			
	})

	afterEach(async function(){
		
	})

  	describe('下单，查询，查挂单', async function() {  		
    	it('订单状态和挂单数量一致', async function() {    		      		
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
})

