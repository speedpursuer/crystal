const util = require('../util/util.js')
const Hedge = require('../strategy/hedge.js')
const Trade = require('./trade.js')
const Backtest = require('./backtest.js')


async function main(){
    global.realMode = true
    global.realSim = true
	try {          
        var exchangeIDs = ['hitbtc', 'okex']    
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
        var backtest = new Backtest("2017-11-01 09:14:55")
        // var backtest = new Backtest("2017-11-01 09:14:55", "2017-11-02 09:14:55")
        // await backtest.BTC()
        // await backtest.LTC()
        // await backtest.ETH()
        await backtest.BCH()
        process.exit()
    }catch (e) {        
        util.log.bright.yellow(e)
        process.exit()  
    }
}

async function testBatch(){
    global.realMode = false
    global.realSim = true
    try {              
        var backtest = new Backtest("2017-10-29 09:14:55")
        // var backtest = new Backtest("2017-11-01 09:14:55", "2017-11-02 09:14:55")
        // await backtest.BTC()
        // await backtest.LTC()
        // await backtest.ETH()

        var list = ['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'okex', 'huobipro']

        for(var i=0; i<list.length; i++) {         
            for(var j=i+1; j<list.length; j++) {
                await backtest.BCHTest([list[i], list[j]])         
            }
        }

        process.exit()
    }catch (e) {        
        util.log.bright.yellow(e)
        process.exit()  
    }
}

main()