const BaseAPI = require('./baseAPI')
const StreamService = require('../ws/streamService')

class StreamAPI extends BaseAPI {

    async fetchOrderBook (symbol, params = {}) {
        return StreamService.instance.getOrderbook(this.id, symbol)
    }

    reconnectStream() {
        StreamService.instance.reconnectStream(this.id)
    }

    disconnectStream() {
        StreamService.instance.disconnectStream(this.id)
    }
}
module.exports = StreamAPI