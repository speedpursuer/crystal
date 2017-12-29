const util = require('../util/util.js')
const Hedge = require('../strategy/hedge.js')
const StaHedge = require('../strategy/staHedge.js')
const HedgeTest = require('../strategy/hedgeTest.js')
const Trade = require('../service/trade.js')
const Backtest = require('./backtest.js')


async function btc() {
    await main('BTC', 'USD', ['okex', 'huobipro', 'quoine', 'zb'])
    // await main('BTC', 'USD', ['okex', 'huobipro', 'quoine', 'Bitfinex', 'Bittrex', 'hitbtc', 'binance'])
}

async function bch() {
    // await main('BCH', 'BTC', ['okex', 'Bitfinex', 'Bittrex', 'hitbtc'])
    await main('BCH', 'BTC', ['okex', 'Bitfinex', 'huobipro', 'Bittrex', 'binance'])
    // await main('BCH', 'BTC', ['okex', 'Bitfinex', 'Bittrex', 'hitbtc', 'binance'])
}

async function eth() {
    await main('ETH', 'BTC', ['okex', 'huobipro', 'Bitfinex', 'Bittrex', 'hitbtc', 'binance'])
}

async function xmr() {
    // await main('XMR', 'BTC', ['hitbtc', 'Poloniex', 'Bitfinex'])
    await main('XMR', 'BTC', ['hitbtc', 'Poloniex', 'Bitfinex', 'Binance'])
}

async function main(base, quote, exchangeIDs){
    global.realMode = true
    global.realSim = true
    try {
        var trade = new Trade(exchangeIDs, new HedgeTest(base, quote))
        trade.run()
    }catch (e) {
        util.log.bright.yellow(e)
        process.exit()
    }
}

async function test(){
    global.realMode = false
    global.realSim = true
    try {
        var backtest = new Backtest("2017-12-23 00:00:00", "2017-12-26 09:18:26", false)

        // var backtest = new Backtest("2017-12-12 10:14:49", "2017-12-15 10:14:49", false)
        // var backtest = new Backtest("2017-12-12 10:14:49", "2017-12-13 00:14:49", false)

        // var backtest = new Backtest("2017-12-12 10:14:49", "2017-12-13 10:14:49", false)
        // var backtest = new Backtest("2017-12-13 10:14:49", "2017-12-14 10:14:49", false)
        // var backtest = new Backtest("2017-12-14 10:14:49", "2017-12-15 10:14:49", false)

        // var backtest = new Backtest("2017-11-01 00:00:00", "2017-11-08 00:00:00", false)
        // var backtest = new Backtest("2017-11-02 09:14:55", "2017-11-03 09:14:55", true)
        // var backtest = new Backtest("2017-12-13 04:14:40", "2017-12-13 10:14:40", false)
        // var backtest = new Backtest("2017-11-01 09:14:55", "2017-11-02 09:14:55")

        // await backtest.BTC()
        // await backtest.LTC()
        // await backtest.ETH()
        await backtest.BCH()
        // await backtest.XMR()
        // await backtest.DASH()
        // await backtest.XRP()
        // await backtest.EOS()
        // await backtest.EOSETH()
        // await backtest.QTUM()
        // await backtest.IOTA()
        // await backtest.BCHTest(['Bitfinex', 'okex'])
        // await backtest.BCHTest(['Poloniex', 'Bittrex', 'hitbtc', 'okex', 'Bitfinex'])     
        process.exit()
    }catch (e) {        
        util.log.bright.yellow(e)
        process.exit()  
    }
}

async function testBatch(){
    var backtest = new Backtest("2017-12-13 21:14:49", "2017-12-16 21:14:49", false)
    // var backtest = new Backtest("2017-11-19 00:00:00", null, false)
    // await backtest.batchBCHTest(['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'okex'])
    // await backtest.batchTest(['Bitfinex', 'Poloniex', 'Bittrex', 'Binance', 'okex', 'huobipro'], 'BCH')
    // await backtest.batchTest(['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'okex', 'huobipro', 'binance'], 'ETH')
    // await backtest.batchTest(['Bitfinex', 'Bittrex', 'Bitstamp', 'Poloniex', 'okex', 'hitbtc', 'huobipro', 'binance', 'quoine', 'zb'], 'BTC')
    // await backtest.batchTest(['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'okex', 'huobipro', 'binance'], 'BCH')
    // await backtest.batchTest(['okex', 'huobipro', 'quoine', 'zb'], 'BTC')
    await backtest.batchTest(['hitbtc', 'Poloniex', 'Bitfinex', 'Bittrex', 'Binance'], 'XMR')
}

eth()