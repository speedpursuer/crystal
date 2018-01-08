const util = require('../util/util.js')
const MongoDB = require('../service/mongoDB.js')
const TradeSim = require('../service/tradeSim')
const ProgressBar = require('progress')
const _ = require('lodash')

const btc_price = 15040
const total_budget = btc_price * 2
const ltc_price = 249
const eth_price = 873
const bch_price = 2662
const xmr_price = 391
const xrp_price = 2.7
const eos_price = 9.23
const dash_price = 1181
const iot_price = 4.01
const qtum_price = 59

class Backtest {
	constructor(start, end, debug) {
		this.mongoDB = new MongoDB()
		this.start = util.timestampFromTime(start)
		this.end = util.timestampFromTime(end)
		this.debug = debug
	}

    async BTC(pairExchangeIDs=null) {
        var exchangeIDs = ['okex', 'huobipro', 'quoine', 'zb']
        await this.backtest("Backtest_BTC/USD", exchangeIDs, pairExchangeIDs, btc_price, 1)
    }

    async BCH(pairExchangeIDs=null) {
        var exchangeIDs = ['okex', 'Bitfinex', 'huobipro', 'Bittrex', 'binance']
        await this.backtest("Backtest_BCH/BTC", exchangeIDs, pairExchangeIDs, bch_price, btc_price)
    }

    async ETH(pairExchangeIDs=null) {
        var exchangeIDs = ['okex', 'huobipro', 'Bitfinex', 'Bittrex', 'hitbtc', 'binance']
		await this.backtest("Backtest_ETH/BTC", exchangeIDs, pairExchangeIDs, eth_price, btc_price)
    }

    async DASH(pairExchangeIDs=null) {
        var exchangeIDs = ['hitbtc', 'Binance', 'Poloniex', 'Bittrex', 'Bitfinex']
		await this.backtest("Backtest_DASH/BTC", exchangeIDs, pairExchangeIDs, dash_price, btc_price)
    }

    async XMR(pairExchangeIDs=null) {
        var exchangeIDs = ['hitbtc', 'Poloniex', 'Bitfinex', 'Binance']
		await this.backtest("Backtest_XMR/BTC", exchangeIDs, pairExchangeIDs, xmr_price, btc_price)
    }

	async LTC(pairExchangeIDs=null) {
	    var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'okex']
	    await this.backtest("Backtest_LTC/BTC", exchangeIDs, pairExchangeIDs, ltc_price, btc_price)
	}

	async XRP(pairExchangeIDs=null) {
	    var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'bitstamp']
	    await this.backtest("Backtest_XRP/BTC", exchangeIDs, pairExchangeIDs, xrp_price, btc_price)
	}

	async EOS(pairExchangeIDs=null) {
        var exchangeIDs = ['Bitfinex', 'huobipro', 'OKEx', 'hitbtc']
        await this.backtest("Backtest_EOS/BTC", exchangeIDs, pairExchangeIDs, eos_price, btc_price)
	}

    async EOSETH(pairExchangeIDs=null) {
        var exchangeIDs = ['Bitfinex', 'Binance', 'huobipro', 'hitbtc']
        await this.backtest("Backtest_EOS/ETH", exchangeIDs, pairExchangeIDs, eos_price, eth_price)
    }

    async QTUM(pairExchangeIDs=null) {
        var exchangeIDs = ['Bittrex', 'Bitfinex', 'Binance', 'OKEx', 'huobipro']
        await this.backtest("Backtest_QTUM/BTC", exchangeIDs, pairExchangeIDs, qtum_price, btc_price)
	}

    async IOTA(pairExchangeIDs=null) {
        var exchangeIDs = ['Bitfinex', 'Binance', 'OKEx']
        await this.backtest("Backtest_IOTA/BTC", exchangeIDs, pairExchangeIDs, iot_price, btc_price)
    }

	async batchTest(list, test) {
	    try {
	        var result = []

	        for(var i=0; i<list.length; i++) {
	            for(var j=i+1; j<list.length; j++) {
	                result.push(await this[`${test}`]([list[i], list[j]]))
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

    async backtest(key, exchangeIDs, pairExchangeIDs, basePrice, quotePrice) {
        return await this.test(key, pairExchangeIDs? pairExchangeIDs: exchangeIDs, total_budget/quotePrice/exchangeIDs.length, total_budget/basePrice/exchangeIDs.length)
	}

	async test(key, exchangeIDs, initBalance, initStocks, from=this.start, to=this.end||util.timestamp) {

        // var trade = new Trade(exchangeIDs, new Sta(base, quote), initBalance, initStocks, this.debug)
        // var trade = new Trade(exchangeIDs, new HedgeTest(base, quote, this.debug), initBalance, initStocks, this.debug)
        // var trade = new Trade(exchangeIDs, new StaHedge(base, quote, this.debug), initBalance, initStocks, this.debug)

        var trade = new TradeSim(key, initBalance, initStocks, exchangeIDs, this.debug)
		await trade.init()

		var market = trade.strategy.fiat == 'USD'? trade.strategy.crypto: trade.strategy.market

		var timeline = await this.mongoDB.getOrderBooksTimeline(market, trade.exchangesIDs, from, to)
		timeline.sort(function(a, b){ return a - b})
		util.log.yellow(`---- 正在回测 - market: ${market}, exchanges: ${trade.exchangesIDs} 开始: ${util.timeFromTimestamp(_.head(timeline))}, 结束: ${util.timeFromTimestamp(_.last(timeline))} ----`)
		var orderBook = await this.mongoDB.getOrderBooks(market, trade.exchangesIDs, from, to)

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

async function test(){
    try {
        let name = util.getParameter()
        var backtest = new Backtest("2018-01-04 11:34:13", '2018-01-06 11:34:13', false)
		await backtest[name]()
        process.exit()
    }catch (e) {
        util.log.bright.yellow(e)
        process.exit()
    }
}

async function testBatch(){
    var backtest = new Backtest("2017-12-13 21:14:49", "2017-12-16 21:14:49", false)
    await backtest.batchTest(['hitbtc', 'Poloniex', 'Bitfinex', 'Bittrex', 'Binance'], 'XMR')
}

test()