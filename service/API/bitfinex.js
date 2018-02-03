const ccxt = require ('ccxt')

class Bitfinex {
	constructor(info) {
		this.v1 = new ccxt['bitfinex'](info)
		this.v2 = new ccxt['bitfinex2'](info)
		this.id = 'bitfinex'
	}

	set timeout(timeout) {
		this.v1.timeout = timeout
		this.v2.timeout = timeout
	}

	set nonce(nonce) {
		this.v1.nonce = nonce
		this.v2.nonce = nonce
	}

	async fetchOrderBook (symbol, params = {}) {
		return await this.v2.fetchOrderBook(symbol, params)
	}

	async fetchBalance (params = {}) {
		return await this.v2.fetchBalance(params)
	}

	createLimitBuyOrder(symbol, ...args) {
		return this.v1.createLimitBuyOrder (symbol, ...args)
	}

	createLimitSellOrder(symbol, ...args) {
		return this.v1.createLimitSellOrder (symbol, ...args)
	}

	async fetchOpenOrders(symbol, params = {}) {
		return await this.v2.fetchOpenOrders(symbol, params)
	}

	async cancelOrder(id, symbol, params = {}) {
		return await this.v1.cancelOrder (id, symbol, params)
	}
}
module.exports = Bitfinex