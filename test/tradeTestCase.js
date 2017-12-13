const should = require('should');
const Hedge = require('../strategy/hedge.js')
const Trade = require('../service/trade.js')
const util = require('../util/util.js')
const _ = require('lodash')


describe('测试trade和stratege', async function() {

	var exchangeIDs
	var trade 	

	this.timeout(50000)

	before(async function() {
		global.realMode = false
		global.realSim = false

		await initETH_BTC()
		// await initBTC_USD()
		// await initLTC_BTC()						
	})

	async function initBTC_USD() {
		exchangeIDs = ['Bitfinex', 'Bitstamp', 'Poloniex']  
		trade = new Trade(exchangeIDs, new Hedge('BTC', 'USD'))		
		await trade.init()
	}

	async function initETH_BTC() {
		exchangeIDs = ['binance', 'bittrex']
		trade = new Trade(exchangeIDs, new Hedge('ETH', 'BTC', true), 1, 30, true)
		await trade.init()
	}

	async function initBTC_BCH() {
		global.realMode = true
		exchangeIDs = ['okex', 'hitbtc']
		trade = new Trade(exchangeIDs, new Hedge('BCH', 'BTC', true), 1000, 10, true)
		await trade.init()
	}

	after(async function(){
	})

  	describe('单次对冲交易', async function() {
    	it('查看对冲细节', async function() {
    		// await trade.updateOrderBook()
            trade.exchanges['binance'].orderBooks = {
            	"bids":[[0.02873272,0.23]],
                "asks":[[0.02686814,0.453]]
            }

            trade.exchanges['bittrex'].orderBooks = {
                "bids":[[0.02673272,0.345]],
                "asks":[[0.025,0.134]]
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

	async function testTrade() {
		global.realMode = true
	}
})