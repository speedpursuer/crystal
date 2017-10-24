const Hedge = require('../strategy/hedge.js')
const Trade = require('./trade.js')
const util = require('../util/util.js')

async function main(){
    global.realMode = false
    global.realSim = true
	try {  
		// var exchangeIDs = ['Bitfinex2', 'Bitstamp', 'GDAX', 'Gemini', 'Poloniex', 'Bittrex', 'Kraken']
        var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'Kraken', 'Bitstamp']  
        // var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'quoine', 'hitbtc', 'Bitstamp', 'lakebtc', 'cex', 'gatecoin', 'livecoin', 'exmo', 'wex', 'itBit']  
        // var exchangeIDs = ['Bitfinex', 'Bitstamp']  
        // var exchangeIDs = ['zaif', 'bitflyer', 'quoine']  
        // var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'quoine', 'hitbtc', 'Bitstamp', 'lakebtc', 'cex', 'gatecoin', 'wex', 'itBit']  
		var trade = new Trade(exchangeIDs, new Hedge('BTC', 'USD'))
		await trade.run()
    }catch (e) {        
        util.log.bright.yellow(e)
        process.exit()  
    } 
}
main()