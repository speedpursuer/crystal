const util = require('../util/util.js')
const Hedge = require('../strategy/hedge.js')
const Trade = require('./trade.js')
const Backtest = require('./backtest.js')


async function btc() {
    await main('BTC', 'USD', ['okex', 'quoine', 'Bitfinex', 'Bittrex', 'hitbtc', 'binance'])
    // await main('BTC', 'USD', ['okex', 'huobipro', 'quoine', 'Bitfinex', 'Bittrex', 'hitbtc', 'binance'])
}

async function bch() {
    // await main('BCH', 'BTC', ['okex', 'Bitfinex', 'Bittrex', 'hitbtc'])
    await main('BCH', 'BTC', ['okex', 'Bitfinex', 'Bittrex', 'hitbtc', 'binance'])
}

async function eth() {
    await main('ETH', 'BTC', ['okex', 'Bitfinex', 'Bittrex', 'hitbtc', 'binance'])
}

async function main(base, quote, exchangeIDs){
    global.realMode = true
    global.realSim = true
    try {
        var trade = new Trade(exchangeIDs, new Hedge(base, quote))
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
        // var backtest = new Backtest("2017-11-01 00:00:00", "2017-11-08 00:00:00", false)
        // var backtest = new Backtest("2017-11-02 09:14:55", "2017-11-03 09:14:55", true)        
        var backtest = new Backtest("2017-11-28 11:14:40", null, false)
        // var backtest = new Backtest("2017-11-01 09:14:55", "2017-11-02 09:14:55")

        // await backtest.BTC()
        // await backtest.LTC()
        // await backtest.ETH()
        await backtest.BCH()
        // await backtest.XMR()
        // await backtest.XRP()
        // await backtest.BCHTest(['Bitfinex', 'okex'])
        // await backtest.BCHTest(['Poloniex', 'Bittrex', 'hitbtc', 'okex', 'Bitfinex'])     
        process.exit()
    }catch (e) {        
        util.log.bright.yellow(e)
        process.exit()  
    }
}

async function testBatch(){
    var backtest = new Backtest("2017-11-28 00:00:00", null, false)
    // var backtest = new Backtest("2017-11-19 00:00:00", null, false)
    // await backtest.batchBCHTest(['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'okex'])
    // await backtest.batchTest(['Bitfinex', 'Poloniex', 'Bittrex', 'Binance', 'okex', 'huobipro'], 'BCH')
    await backtest.batchTest(['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'okex', 'huobipro', 'binance'], 'ETH')
    // await backtest.batchTest(['Bitfinex', 'Bittrex', 'Bitstamp', 'Poloniex', 'okex', 'hitbtc', 'huobipro', 'binance', 'quoine', 'zb'], 'BTC')
    // await backtest.batchTest(['Poloniex', 'okex'], 'BCH')
    // await backtest.batchTest(['Bittrex', 'okex'], 'BCH')
}

btc()