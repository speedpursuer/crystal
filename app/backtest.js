const util = require('../util/util.js')
const database = require('../service/database.js')
const Hedge = require('../strategy/hedge.js')
const Sta = require('../strategy/sta.js')
const StaHedge = require('../strategy/staHedge.js')
const Trade = require('../service/trade.js')
const ProgressBar = require('progress')
const _ = require('lodash')

const total_budget = 13873 * 3
const btc_price = 13873
const ltc_price = 351
const eth_price = 676
const bch_price = 1719
const xmr_price = 357
const xrp_price = 0.73
const eos_price = 8.64
const dash_price = 1090
const iot_price = 4
const qtum_price = 55

class Backtest {
	constructor(start, end, debug) {
		this.start = util.timestampFromTime(start)
		this.end = util.timestampFromTime(end)
		this.debug = debug
	}

	async BTC() {
        // var exchangeIDs = ['okex', 'huobipro']
        var exchangeIDs = ['okex', 'huobipro', 'quoine', 'zb']
        // var exchangeIDs = ['okex', 'huobipro', 'Quoine', 'zb']
        // var exchangeIDs = ['Bitfinex', 'Bittrex', 'Bitstamp', 'Poloniex', 'okex', 'hitbtc', 'huobipro', 'binance', 'quoine', 'zb']
	    await this._BTC(exchangeIDs)
	}

	async LTC() {
	    var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'okex']
        // var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'okex', 'huobipro']
	    await this.backtest(exchangeIDs, "LTC", "BTC", total_budget/btc_price/exchangeIDs.length, total_budget/ltc_price/exchangeIDs.length)
	}

	async ETH() {
        var exchangeIDs = ['okex', 'huobipro', 'Bitfinex', 'Bittrex', 'hitbtc', 'binance']
        // var exchangeIDs = ['okex', 'hitbtc', 'binance', 'poloniex']
        // var exchangeIDs = ['Bitfinex', 'Bittrex', 'huobipro', 'okex', 'hitbtc']
        // var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'okex', 'huobipro', 'binance']
        // var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'huobipro', 'okex', 'hitbtc', 'Binance']
        // var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'huobipro', 'okex', 'hitbtc']
        // var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'okex', 'huobipro']
        // var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'okex', 'huobipro']
        // await this.backtest(exchangeIDs, "ETH", "BTC", total_budget/btc_price/exchangeIDs.length, total_budget/eth_price/exchangeIDs.length)
        await this._ETH(exchangeIDs)
	}

	async BCH() {
	    // var exchangeIDs = ['hitbtc', 'okex']
	    // var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'okex', 'huobipro']
        // var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'okex', 'huobipro']
        // var exchangeIDs = ['Bitfinex', 'Bittrex', 'okex', 'hitbtc']
        // var exchangeIDs = ['Bitfinex', 'huobipro', 'Bittrex', 'okex', 'Binance', 'hitbtc']
        // var exchangeIDs = ['Bittrex', 'okex', 'Binance']
        // var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'okex', 'Binance', 'huobipro', 'hitbtc']
        // var exchangeIDs = ['okex', 'binance', 'Bittrex', 'huobipro']
        var exchangeIDs = ['Bitfinex', 'Bittrex', 'okex', 'huobipro']
        // var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'okex', 'huobipro', 'binance']
	    await this._BCH(exchangeIDs)
	}

	async XMR() {
	    var exchangeIDs = ['hitbtc', 'Poloniex', 'Bitfinex', 'Binance']
        // var exchangeIDs = ['hitbtc', 'Poloniex', 'Bitfinex', 'Bittrex', 'Binance']
        await this._XMR(exchangeIDs)
	}

    async DASH() {
        var exchangeIDs = ['hitbtc', 'Binance', 'Poloniex', 'Bittrex', 'Bitfinex']
        await this._DASH(exchangeIDs)
    }

	async XRP() {
	    var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'bitstamp']
	    await this.backtest(exchangeIDs, "XRP", "BTC", total_budget/btc_price/exchangeIDs.length, total_budget/xrp_price/exchangeIDs.length)
	}

	async EOS() {
        var exchangeIDs = ['Bitfinex', 'Binance', 'huobipro', 'OKEx', 'hitbtc']
        // var exchangeIDs = ['Bitfinex', 'Binance', 'huobipro', 'OKEx', 'hitbtc']
        await this.backtest(exchangeIDs, "EOS", "BTC", total_budget/btc_price/exchangeIDs.length, total_budget/eos_price/exchangeIDs.length)
	}

    async EOSETH() {
        var exchangeIDs = ['Bitfinex', 'Binance', 'huobipro', 'hitbtc']
        await this.backtest(exchangeIDs, "EOS", "ETH", total_budget/eth_price/exchangeIDs.length, total_budget/eos_price/exchangeIDs.length)
    }

    async QTUM() {
        var exchangeIDs = ['Bittrex', 'Bitfinex', 'Binance', 'OKEx', 'huobipro']
        await this.backtest(exchangeIDs, "QTUM", "BTC", total_budget/btc_price/exchangeIDs.length, total_budget/qtum_price/exchangeIDs.length)
	}

    async IOT() {
        var exchangeIDs = ['Bitfinex', 'Binance', 'OKEx']
        await this.backtest(exchangeIDs, "IOTA", "BTC", total_budget/btc_price/exchangeIDs.length, total_budget/iot_price/exchangeIDs.length)
    }

	async _BCH(exchangeIDs) {
		return await this.backtest(exchangeIDs, "BCH", "BTC", total_budget/btc_price/exchangeIDs.length, total_budget/bch_price/exchangeIDs.length)
	}

    async _ETH(exchangeIDs) {
        await this.backtest(exchangeIDs, "ETH", "BTC", total_budget/btc_price/exchangeIDs.length, total_budget/eth_price/exchangeIDs.length)
    }

	async _BTC(exchangeIDs) {
	    return await this.backtest(exchangeIDs, "BTC", "USD", total_budget/exchangeIDs.length, total_budget/btc_price/exchangeIDs.length)
	}

    async _DASH(exchangeIDs) {
        await this.backtest(exchangeIDs, "DASH", "BTC", total_budget/btc_price/exchangeIDs.length, total_budget/dash_price/exchangeIDs.length)
    }

    async _XMR(exchangeIDs) {
        await this.backtest(exchangeIDs, "XMR", "BTC", total_budget/btc_price/exchangeIDs.length, total_budget/xmr_price/exchangeIDs.length)
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

            // result = _.sortBy(result, [function(o) { return o.profit }])
            //
            // _.forEach(result, function(v) {
            //     util.log.yellow(`******** Exchanges: ${v.exchanges}, ${v.start} - ${v.end} ********`)
            //     util.log.green(`Profit: ${v.profit}, Diff: ${v.diff}`)
            //     util.log("-------------------------------------------")
            // });

            let finalResult = {}

            _.forEach(result, function (value) {
                setValue(finalResult, value.exchanges[0], value.profit)
                setValue(finalResult, value.exchanges[1], value.profit)
            })

            finalResult = _.sortBy(finalResult, [function(o) { return o.total }])

            _.forEach(finalResult, function(v) {
                util.log(v.id, v.total)
            })

	        process.exit()
	    }catch (e) {        
	        util.log.bright.yellow(e)
	        process.exit()  
	    }

        function setValue(result, key, value) {
            if(result[key]) {
                result[key].total += value
            }else{
                result[key] = {
                    id: key,
                    total: value
                }
            }
        }
	}

	async backtest(exchangeIDs, base, quote, initBalance, initStocks, from=this.start, to=this.end||util.timestamp) {

        // var trade = new Trade(exchangeIDs, new Sta(base, quote), initBalance, initStocks, this.debug)
        var trade = new Trade(exchangeIDs, new Hedge(base, quote, this.debug), initBalance, initStocks, this.debug)
        // var trade = new Trade(exchangeIDs, new StaHedge(base, quote, this.debug), initBalance, initStocks, this.debug)
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

			await trade.strategy.doTrade(util.timeFromTimestamp(time))
            await trade.strategy.updateBalance()

            if(!this.debug) bar.tick()
		}

		if(trade.strategy.after) {
			await trade.strategy.after()
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