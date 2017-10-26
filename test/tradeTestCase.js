const should = require('should');
const Hedge = require('../strategy/hedge.js')
const Trade = require('../app/trade.js')
const util = require('../util/util.js')
const _ = require('lodash')


describe('测试trade和stratege', async function() {

	var exchangeIDs = ['Bitfinex', 'Bitstamp', 'Poloniex']  
	var trade 	

	this.timeout(50000)

	before(async function() {
		global.realMode = false
		global.realSim = false				
		
		trade = new Trade(exchangeIDs, new Hedge('BTC', 'USD'))		
		await trade.init()

        trade.exchanges['bitfinex'].orderBooks = 
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

		trade.exchanges['bitstamp'].orderBooks = 
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

		trade.exchanges['poloniex'].orderBooks = 
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
	})

	after(async function(){
		trade.strategy.database.deleteData()
	})

  	describe('对冲交易', async function() {  		
    	it('单次交易币差可能为正、负、零', async function() {    		      		
      		await trade.strategy.doTrade()
      		await trade.strategy.reportBalance()
			trade.strategy.stockDiff.should.not.equal(0)			
    	})
  	})

  	describe('平衡', async function() {  		

  		async function testBalance(diff) {
  			trade.strategy.stockDiff = diff
    		trade.strategy.initStock = trade.strategy.currStock - diff

    		trade.strategy.reportBalance()

    		await simTrade(function() {
    			return _.round(trade.strategy.stockDiff, 3) == 0
    		})
			    		
			_.round(trade.strategy.stockDiff, 3).should.equal(0)
  		}

    	it('币多情况', async function() {
    		await testBalance(0.1)    					
    	})

    	it('币少情况', async function() {    		      		
      		await testBalance(-0.1)    			
    	})
  	})

  	describe('完整交易', async function() {  		
    	it('循环交易，直至现金盈利大于1', async function() {
    		await simTrade(function() {
    			return trade.strategy.balanceDiff > 1 && trade.strategy.stockDiff == 0
    		})
			    		
	        trade.strategy.balanceDiff.should.be.above(0)
	        trade.strategy.stockDiff.should.equal(0)	
    	})
  	})

  	async function simTrade(condition) {

  		if(typeof condition !== "function") throw 'now condition function setup'

		while(true) {
        	await trade.strategy.doTrade()        
        	await trade.strategy.reportBalance()
        	if(condition()) {
        		break
        	}
        }
	}
})