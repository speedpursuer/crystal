const should = require('should');
const Hedge = require('../strategy/hedge.js')
const Trade = require('../app/trade.js')
const util = require('../util/util.js')


describe.skip('exchange class', async function() {

	var exchangeIDs = ['Bitfinex2', 'Bitstamp'] 
	var trade 

	before(async function() {
		
		trade = new Trade(exchangeIDs, new Hedge("USD"))		
		await trade.init()

        trade.exchanges['Bitfinex2'].orderBooks = 
        {
        	asks: [
				[5000, 0.1],
				[5003, 0.2]
			],
			bids: [
				[5055, 0.5],
				[5004, 0.3],
			]			
		}

		trade.exchanges['Bitstamp'].orderBooks = 
        {
			asks: [
				[5000, 0.1],
				[5003, 0.2]
			],
			bids: [
				[5005, 0.5],
				[5004, 0.3],
			]
		}
	});

	afterEach(async function(){
		
	})

  	describe('测试交易', async function() {  		
    	it('交易结果不应该为0', async function() {    		      		
      		await trade.strategy.doTrade()
      		await trade.strategy.reportBalance()        
      		util.log.green(trade.strategy.stockDiff)
			trade.strategy.stockDiff.should.not.equal(0)
			// trade.strategy.balanceDiff.should.not.equal(0)
    	});
  	});

  	describe('2', async function() {  		
    	it('交易结果不应该为0', async function() {
    		await trade.strategy.doTrade()
      		await trade.strategy.reportBalance()
      		util.log.green(trade.strategy.stockDiff)
			trade.strategy.stockDiff.should.not.equal(0)
    	});
  	});

});