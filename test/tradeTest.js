const Hedge = require('../strategy/hedge.js')
const Trade = require('../app/trade.js')
const util = require('../util/util.js')

async function main(){	
	try {  
		// var exchangeIDs = ['Bitfinex2', 'Bitstamp', 'GDAX', 'Gemini', 'Poloniex', 'Bittrex', 'Kraken']
        // var exchangeIDs = ['Bitfinex2', 'Poloniex', 'Bittrex', 'Kraken']  
        var exchangeIDs = ['Bitfinex', 'Bitstamp', 'Poloniex']  
		var trade = new Trade(exchangeIDs, new Hedge('BTC', 'USD'))
		
		await trade.init()

		util.log("******************************************************")                                            


        trade.exchanges['Bitfinex'].orderBooks = 
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

		trade.exchanges['Poloniex'].orderBooks = 
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

		// util.log("Bitfinex2 fee:", trade.exchanges['Bitfinex'].fee)
		// util.log("Bitstamp fee:", trade.exchanges['Bitstamp'].fee)
		// util.log("Bitstamp fee:", trade.exchanges['Bitstamp'].fee)
    	

        while(true) {
        	await trade.strategy.doTrade()        
        	await trade.strategy.reportBalance()
        	if(trade.strategy.balanceDiff > 0.5 && trade.strategy.stockDiff == 0) {
        		break
        	}
        }

        process.exit()  

    }catch (e) {
        util.log.bright.yellow(e)        
    } 
}
main()