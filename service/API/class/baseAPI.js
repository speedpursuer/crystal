const ccxt = require ('ccxt')

class BaseAPI {
    constructor(info) {
        this.id = info.id
        this.interval = 200
        this.restAPI = new ccxt[this.id](info)
        this.restAPI.timeout = 20000
        this.restAPI.nonce = function(){ return this.milliseconds () }
    }

    async fetchOrderBook (symbol, params = {}) {
        return await this.restAPI.fetchOrderBook(symbol, params)
    }

    async fetchBalance () {
        return await this.restAPI.fetchBalance()
    }

    createLimitBuyOrder(symbol, ...args) {
        return this.restAPI.createLimitBuyOrder (symbol, ...args)
    }

    createLimitSellOrder(symbol, ...args) {
        return this.restAPI.createLimitSellOrder (symbol, ...args)
    }

    async fetchOpenOrders(symbol, params = {}) {
    	return await this.restAPI.fetchOpenOrders(symbol, params)
    }

    async cancelOrder(id, symbol, params = {}) {
        return await this.restAPI.cancelOrder (id, symbol, params)
    }
}
module.exports = BaseAPI