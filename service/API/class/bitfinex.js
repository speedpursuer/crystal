const StreamAPI = require('./streamAPI')
const StreamService = require('../ws/streamService')

class Bitfinex extends StreamAPI{

    async fetchBalance () {
        return StreamService.instance.getAccount(this.id)
    }

    async fetchOpenOrders(symbol) {
        return StreamService.instance.getOpenOrders(this.id, symbol)
    }
}
module.exports = Bitfinex