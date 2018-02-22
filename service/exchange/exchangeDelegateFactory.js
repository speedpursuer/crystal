const ExhangeSim = require ('../API/class/exchangeSim')
const ExchangeDelegate = require ('./exchangeDelegate')
const Bitfinex = require('../API/class/bitfinex')
const StreamAPI = require('../API/class/streamAPI')

const ONE_SEC = 1000
const ONE_MIN = 60 * ONE_SEC
const ONE_HOUR = 60 * ONE_MIN

const config = {
    failureInterval: ONE_MIN,
    failureThreshold: 2,
    retryInterval: 0.5 * ONE_HOUR,
    retryThreshold: 2,
    retryDelay: 3 * ONE_MIN
}

class ExchangeDelegateFactory {
    constructor() {
        this.exchangePoor = {}
        this.exchangeDelegateConfig = config
    }

    getExchangeDelegate(info, debug=false) {
        if(!this.exchangePoor[info.id]) {
            let api = this.createAPI(info)
            this.exchangePoor[info.id] = this.createExchangeDelegate(api, debug)
        }
        return this.exchangePoor[info.id]
    }

    getExchangeDelegateSim(info, balance, debug=false) {
        if(!this.exchangePoor[info.id]) {
            let api = new ExhangeSim(info, balance, 0.75, 0.75)
            this.exchangePoor[info.id] = this.createExchangeDelegate(api, debug)
            return this.exchangePoor[info.id]
        }else {
            let exchangeDelegate = this.exchangePoor[info.id]
            exchangeDelegate.api.addBalance(balance)
            return exchangeDelegate
        }
    }

    createExchangeDelegate(api, debug) {
        return new ExchangeDelegate(api, this.exchangeDelegateConfig, debug)
    }

    createAPI(info) {
        const apis = {
            bitfinex: Bitfinex,
        }
        let id = info.id, apiClass = StreamAPI
        if(apis[id]) {
            apiClass = apis[id]
        }
        return new apiClass(info)
    }
}
var exchangeFactory = new ExchangeDelegateFactory()
module.exports = exchangeFactory
