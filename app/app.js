const util = require('../util/util.js')
const Hedge = require('../strategy/hedge.js')
const Trade = require('./trade.js')
const Backtest = require('./backtest.js')

async function main(){
    global.realMode = true
    global.realSim = true
	try {          
        var exchangeIDs = ['hitbtc', 'bittrex', 'okex', 'bitfinex']    
        // var exchangeIDs = ['hitbtc', 'bitfinex', 'bittrex', 'poloniex', 'okex']    
        // var exchangeIDs = ['hitbtc', 'okex', 'poloniex', 'bittrex', 'huobipro']    
        var trade = new Trade(exchangeIDs, new Hedge("BCH", "BTC"))
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
        var backtest = new Backtest("2017-11-01 00:00:00", "2017-11-08 00:00:00", false)
        // var backtest = new Backtest("2017-11-02 09:14:55", "2017-11-03 09:14:55", true)        
        // var backtest = new Backtest("2017-11-01 09:14:55")
        // var backtest = new Backtest("2017-11-01 09:14:55", "2017-11-02 09:14:55")
        // await backtest.BTC()
        // await backtest.LTC()
        // await backtest.ETH()
        await backtest.BCH()
        // await backtest.BCHTest(['Bitfinex', 'okex'])  
        // await backtest.BCHTest(['Poloniex', 'Bittrex', 'hitbtc', 'okex', 'Bitfinex'])     
        process.exit()
    }catch (e) {        
        util.log.bright.yellow(e)
        process.exit()  
    }
}

async function testBatch(){
    var backtest = new Backtest("2017-11-04 00:00:00", "2017-11-08 00:00:00", false)
    await backtest.batchBCHTest(['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'okex'])
}

main()