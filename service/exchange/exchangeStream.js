const Exchange = require ('./exchange')
const StreamService = require('../API/ws/streamService')
const util = require ('../../util/util.js')

class ExchangeStream extends Exchange {
    constructor(exchangeDelegate, info, crypto, fiat, debug) {
        super(exchangeDelegate, info, crypto, fiat, debug)
        // StreamService.instance.register(this.id, this.symbol)
        this.registerDelegateEvents()
    }

    async fetchOrderBook() {
        this.orderBooks = StreamService.instance.getOrderbook(this.id, this.symbol)
        // this.checkOrderbook()
    }

    registerDelegateEvents() {
        let that = this
        this.exchangeDelegate.on('reopen', function(){
            StreamService.instance.reconnectStream(that.id)
        })
        this.exchangeDelegate.on('closed', function(){
            StreamService.instance.disconnectStream(that.id)
        })
        // this.exchangeDelegate.on('stopped', function(){
        //     StreamService.instance.disconnectStream(that.id)
        // })
    }
}

module.exports = ExchangeStream