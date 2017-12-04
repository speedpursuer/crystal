const util = require('../util/util.js')
const Hedge = require('../strategy/hedge.js')
const Trade = require('./trade.js')
const Backtest = require('./backtest.js')

async function main(){
    global.realMode = true
    global.realSim = true
	try {          
        var exchangeIDs = ['okex', 'huobipro', 'quoine']
        // var exchangeIDs = ['hitbtc', 'bittrex', 'okex', 'poloniex']
        // var exchangeIDs = ['hitbtc', 'bitfinex', 'bittrex', 'poloniex', 'okex']
        // var exchangeIDs = ['hitbtc', 'okex', 'poloniex', 'bittrex', 'huobipro']
        var trade = new Trade(exchangeIDs, new Hedge("BTC", "USD"))
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
        await backtest.ETH()
        // await backtest.BCH()
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

main()