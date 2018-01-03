const should = require('should');
const HedgeTest = require('../strategy/hedgeTest.js')
const TradeSim = require('../service/tradeSim')
const util = require('../util/util.js')
const _ = require('lodash')


describe('测试trade和stratege', async function() {

	var exchangeIDs
	var trade 	

	this.timeout(50000)

	before(async function() {
		// await initETH_BTC()
		// await initBTC_USD()
		// await initLTC_BTC()						
	})

    after(async function(){
    })

	async function initBTC_USD() {
		exchangeIDs = ['Bitfinex', 'Bitstamp', 'Poloniex']
		trade = new TradeSim('BTC/USD', 20000, 1, exchangeIDs)
		await trade.init()
	}

	async function initETH_BTC() {
		exchangeIDs = ['bittrex', 'hitbtc']
        trade = new TradeSim('ETH/BTC', 1, 30, exchangeIDs)
		await trade.init()
	}

	async function initBTC_BCH() {
		exchangeIDs = ['okex', 'hitbtc']
        trade = new TradeSim('BCH/BTC', 1000, 10, exchangeIDs)
		await trade.init()
	}

  	describe('单次对冲交易', async function() {
    	it('查看对冲细节', async function() {
            await initETH_BTC()

            trade.exchanges['hitbtc'].orderBooks = {
            	"bids":[[0.02873272,2.23]],
                "asks":[[0.02686814,0.453]]
            }

            trade.exchanges['bittrex'].orderBooks = {
                "bids":[[0.02673272,0.345]],
                "asks":[[0.025,1.92]]
            }

      		await trade.strategy.doTrade()
      		await trade.strategy.updateBalance()
    	})
  	})

  	describe('平衡', async function() {
  		async function testBalance(diff) {
  			trade.strategy.stockDiff = diff
    		trade.strategy.initStock = trade.strategy.currStock - diff

    		await trade.strategy.updateBalance()

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

  	describe('测试BTC_BCH', async function() {  		
    	it('循环交易', async function() {
    		await initBTC_BCH()
    		await simTrade(function() {
    			return true
    		})			    		    
    	})
  	})

  	async function simTrade(condition) {

  		if(typeof condition !== "function") throw 'now condition function setup'

		while(true) {
			await trade.updateOrderBook()  
        	await trade.strategy.doTrade()        
        	await trade.strategy.updateBalance()
        	if(condition()) {
        		break
        	}
        }
	}
})