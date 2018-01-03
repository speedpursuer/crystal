const _ = require('lodash')
const Trade = require('./trade')

class TradeSim extends Trade{
	constructor(tradeName, initBalance, initStocks, exchangeIDs=null, debug=true){
		super(tradeName, debug)
		this.initBalance = initBalance
		this.initStocks = initStocks
		this.exchangesIDs = exchangeIDs
	}

    createExchanges() {
        this.exchangesIDs = _.sortBy(_.map(this.exchangesIDs? this.exchangesIDs: this.tradeBuilder.exchanges, function(i) {return i.toLowerCase()}) )
        this.exchanges = this.tradeBuilder.buildExchangesSim(this.exchangesIDs, this.initBalance, this.initStocks)
    }
}
module.exports = TradeSim