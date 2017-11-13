const ccxt = require ('ccxt')

class Bitfinex {
	constructor(info) {
		super(info)
		this.api2 = new ccxt['bitfinex2'](info)
		this.api2.timeout = this.api.timeout
		this.api2.nonce = this.api.nonce
		// this.v1 = new ccxt['bitfinex'](info)
		// this.id = 'bitfinex'
	}

	async fetchOrderBook (symbol, params = {}) {
		return await this.api2.fetchOrderBook(symbol, params)
	}

	async fetchBalance (params = {}) {
		return await this.api2.fetchBalance(params)
	}

	createLimitBuyOrder(symbol, ...args) {
		return this.api.createLimitBuyOrder (symbol, ...args)
	}

	createLimitSellOrder(symbol, ...args) {
		return this.api.createLimitSellOrder (symbol, ...args)
	}

	async fetchOpenOrders(symbol, params = {}) {
		return await this.api.fetchOpenOrders(symbol, params)
	}

	async cancelOrder(id, symbol, params = {}) {
		return await this.api.cancelOrder (id, symbol, params)
	}
}
module.exports = Bitfinex