const util = require('../util/util.js')
const database = require('../service/database.js')
const Hedge = require('../strategy/hedge.js')
const Arbitrage = require('../strategy/arbitrage.js')
const Trade = require('./trade.js')
const ProgressBar = require('progress')

const total_budget = 15000 / 2
const btc_price = 6400
const ltc_price = 55
const eth_price = 303
const bch_price = 445

class Backtest {
	constructor(start, end) {		
		this.start = util.timestampFromTime(start)
		this.end = util.timestampFromTime(end)
	}

	async BTC() {	  
	    var exchangeIDs = ['Bitfinex', 'Bittrex', 'Bitstamp', 'Poloniex', 'okex', 'hitbtc', 'huobipro']
	    await this.backtest(exchangeIDs, "BTC", "USD", total_budget/exchangeIDs.length, total_budget/btc_price/exchangeIDs.length)
	}

	async LTC() {
	    var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'okex', 'huobipro']
	    await this.backtest(exchangeIDs, "LTC", "BTC", total_budget/btc_price/exchangeIDs.length, total_budget/ltc_price/exchangeIDs.length)
	}

	async ETH() {
	    var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'okex', 'huobipro']
	    await this.backtest(exchangeIDs, "ETH", "BTC", total_budget/btc_price/exchangeIDs.length, total_budget/eth_price/exchangeIDs.length)
	}

	async BCH() {
	    var exchangeIDs = ['hitbtc', 'okex']
	    // var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'okex', 'huobipro']
	    await this.backtest(exchangeIDs, "BCH", "BTC", total_budget/btc_price/exchangeIDs.length, total_budget/bch_price/exchangeIDs.length)
	}

	async BCHTest(exchangeIDs) {
		await this.backtest(exchangeIDs, "BCH", "BTC", total_budget/btc_price/exchangeIDs.length, total_budget/bch_price/exchangeIDs.length)
	}

	async backtest(exchangeIDs, base, quote, initBalance, initStocks, from=this.start, to=this.end||util.timestamp) {

		// var trade = new Trade(exchangeIDs, new Arbitrage(base, quote), initBalance, initStocks)		
		var trade = new Trade(exchangeIDs, new Hedge(base, quote, false), initBalance, initStocks, false)		

		await trade.init()
			
		var market = trade.strategy.fiat == 'USD'? trade.strategy.crypto: trade.strategy.market

		util.log.yellow(`---- 回测 - market: ${market}, exchanges: ${trade.exchangesIDs} ----`)

		var timeline = await database.getOrderBooksTimeline(market, trade.exchangesIDs, from, to)			
		timeline.sort(function(a, b){ return a - b})
		var orderBook = await database.getOrderBooks2(market, trade.exchangesIDs, from, to)
		if(trade.strategy.before) {
			trade.strategy.before()
		}
		var bar = new ProgressBar(':bar', { total: timeline.length, clear: true})
		for(var time of timeline) {		
			// util.log.yellow(`******************************* 测试时间: ${util.timeFromTimestamp(time)} *******************************`)
			var skip = false
			for(var id of trade.exchangesIDs) {
				var key = `${market}-${id}-${time}`
				if(orderBook[key]) {
					trade.exchanges[id].orderBooks = orderBook[key]
				}else{
					// util.log("Not Got: ", key)
					skip = true
					break
				}					
			}				
			if(skip) continue				
			await trade.strategy.doTrade()
            await trade.strategy.updateBalance(false)
            bar.tick()                     
		}
		if(trade.strategy.after) {
			trade.strategy.after()
		}else {
			await trade.strategy.updateBalance(true)
		}
		// util.log.green("回测完成")					
	}
}
module.exports = Backtest