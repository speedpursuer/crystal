const Hedge = require('../strategy/hedge.js')
const Trade = require('../app/trade.js')
const util = require('../util/util.js')

async function main(){	
	try {  
		// var exchangeIDs = ['Bitfinex2', 'Bitstamp', 'GDAX', 'Gemini', 'Poloniex', 'Bittrex', 'Kraken']
        // var exchangeIDs = ['Bitfinex2', 'Poloniex', 'Bittrex', 'Kraken']  
        var exchangeIDs = ['Bitfinex2', 'Bitstamp']  
		var trade = new Trade(exchangeIDs, new Hedge("USD"))
		
		await trade.init()

		util.log("******************************************************")                                            


        trade.exchanges['Bitfinex2'].orderBooks = 
        {
        	asks: [
				[5000, 0.1],
				[5003, 0.2]
			],
			bids: [
				[5055, 0.5],
				[5004, 0.3],
			]			
		}

		trade.exchanges['Bitstamp'].orderBooks = 
        {
			asks: [
				[5000, 0.1],
				[5003, 0.2]
			],
			bids: [
				[5005, 0.5],
				[5004, 0.3],
			]
		}

		util.log("Bitfinex2 fee:", trade.exchanges['Bitfinex2'].fee)
		util.log("Bitstamp fee:", trade.exchanges['Bitstamp'].fee)
     
        await trade.strategy.doTrade()                                             

        await trade.strategy.reportBalance()        

    }catch (e) {
        util.log.bright.yellow(e)        
    } 
}
// main()