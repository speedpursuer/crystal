const util = require('../util/util.js')
const database = require('../service/database.js')
const Hedge = require('../strategy/hedge.js')
const Arbitrage = require('../strategy/arbitrage.js')
const Sta = require('../strategy/sta.js')
const Trade = require('./trade.js')
const ProgressBar = require('progress')
const _ = require('lodash')

const total_budget = 37650 / 2
const btc_price = 6600
const ltc_price = 60
const eth_price = 314
const bch_price = 1266
const xmr_price = 122
const xrp_price = 0.2

class Backtest {
	constructor(start, end, debug) {
		this.start = util.timestampFromTime(start)
		this.end = util.timestampFromTime(end)
		this.debug = debug
	}

	async BTC() {
        // var exchangeIDs = ['okex', 'huobipro']
	    var exchangeIDs = ['Poloniex', 'Bittrex', 'okex', 'Bitfinex', 'huobipro']
	    // var exchangeIDs = ['Bitfinex', 'Bittrex', 'okex', 'hitbtc', 'huobipro']
	    // var exchangeIDs = ['Bitfinex', 'Bittrex', 'Bitstamp', 'Poloniex', 'okex', 'hitbtc', 'huobipro']
	    await this._BTC(exchangeIDs)
	}

	async LTC() {
	    var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'okex', 'huobipro']
	    await this.backtest(exchangeIDs, "LTC", "BTC", total_budget/btc_price/exchangeIDs.length, total_budget/ltc_price/exchangeIDs.length)
	}

	async ETH() {
	    var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'huobipro']
        // var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'okex', 'huobipro']
        // var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'okex', 'huobipro']
	    await this.backtest(exchangeIDs, "ETH", "BTC", total_budget/btc_price/exchangeIDs.length, total_budget/eth_price/exchangeIDs.length)
	}

	async BCH() {
	    // var exchangeIDs = ['hitbtc', 'okex']
	    // var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'okex', 'huobipro']
        // var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'okex', 'huobipro']
	    var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'okex', 'huobipro']
	    await this._BCH(exchangeIDs)
	}

	async XMR() {
	    var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc']
	    await this.backtest(exchangeIDs, "XMR", "BTC", total_budget/btc_price/exchangeIDs.length, total_budget/xmr_price/exchangeIDs.length)
	}

	async XRP() {
	    var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'bitstamp']
	    await this.backtest(exchangeIDs, "XRP", "BTC", total_budget/btc_price/exchangeIDs.length, total_budget/xrp_price/exchangeIDs.length)
	}

	async _BCH(exchangeIDs) {
		return await this.backtest(exchangeIDs, "BCH", "BTC", total_budget/btc_price/exchangeIDs.length, total_budget/bch_price/exchangeIDs.length)
	}

	async _BTC(exchangeIDs) {
	    return await this.backtest(exchangeIDs, "BTC", "USD", total_budget/exchangeIDs.length, total_budget/btc_price/exchangeIDs.length)
	}

	async batchTest(list, test) {
		global.realMode = false
	    global.realSim = true
	    try {              	        
	        var result = []

	        for(var i=0; i<list.length; i++) {         
	            for(var j=i+1; j<list.length; j++) {
	                result.push(await this[`_${test}`]([list[i], list[j]]))
	            }
	        }

	        result = _.sortBy(result, [function(o) { return o.profit }])

	        _.forEach(result, function(v) {
	            util.log.yellow(`******** Exchanges: ${v.exchanges}, ${v.start} - ${v.end} ********`)
	            util.log.green(`Profit: ${v.profit}, Diff: ${v.diff}`)
	            util.log("-------------------------------------------")
	        });

	        process.exit()
	    }catch (e) {        
	        util.log.bright.yellow(e)
	        process.exit()  
	    }
	}

	async backtest(exchangeIDs, base, quote, initBalance, initStocks, from=this.start, to=this.end||util.timestamp) {

		// var trade = new Trade(exchangeIDs, new Arbitrage(base, quote), initBalance, initStocks, this.debug)
        // var trade = new Trade(exchangeIDs, new Sta(base, quote), initBalance, initStocks, this.debug)
        var trade = new Trade(exchangeIDs, new Hedge(base, quote, this.debug), initBalance, initStocks, this.debug)
		await trade.init()

		var market = trade.strategy.fiat == 'USD'? trade.strategy.crypto: trade.strategy.market		

		var timeline = await database.getOrderBooksTimeline(market, trade.exchangesIDs, from, to)			
		timeline.sort(function(a, b){ return a - b})
		util.log.yellow(`---- 正在回测 - market: ${market}, exchanges: ${trade.exchangesIDs} 开始: ${util.timeFromTimestamp(_.head(timeline))}, 结束: ${util.timeFromTimestamp(_.last(timeline))} ----`)
		var orderBook = await database.getOrderBooks(market, trade.exchangesIDs, from, to)

		if(trade.strategy.before) {
			trade.strategy.before()
		}

		var bar = new ProgressBar(':bar', { total: timeline.length, clear: true})
		
		for(var time of timeline) {		
			if(this.debug) util.log(`******************************* 测试时间: ${util.timeFromTimestamp(time)} *******************************`)
			
			for(var id of trade.exchangesIDs) {
				var key = `${market}-${id}-${time}`
				if(orderBook[key]) {
					trade.exchanges[id].orderBooks = orderBook[key]
				}else {
					trade.exchanges[id].orderBooks = null
				}							
			}

			await trade.strategy.doTrade()
            await trade.strategy.updateBalance()
            
            if(!this.debug) bar.tick()                     
		}

		if(trade.strategy.after) {
			trade.strategy.after()
		}

		await trade.strategy.logProfit()
		util.log.green("回测完成")			

		return {
			exchanges: exchangeIDs,
			start: util.timeFromTimestamp(_.head(timeline)),
			end: util.timeFromTimestamp(_.last(timeline)),
			profit: trade.strategy.currProfit,
			diff: trade.strategy.stockDiff
		}		
	}
}
module.exports = Backtest