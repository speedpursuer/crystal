const util = require ('../../util/util.js')
const tradeConfig = require('../../config/tradeConfig')
const backtestConfig = require('../../config/backtestConfig')
const tradeAllConfig = require('../../config/tradeAllConfig')
const Exchange = require('../exchange/exchange.js')
const factory = require ('../exchange/exchangeDelegateFactory.js')
const StreamService = require('../API/ws/streamService')


class TradeBuilder{
    constructor(key, debug=true){
        this.key = key
        this.debug = debug
        this.buildConfig(key)
    }

    buildConfig(key) {
        let allConfig = Object.assign(tradeConfig, backtestConfig, tradeAllConfig)
        let config = allConfig[key]
        if(!config) throw `trade config for ${key} not found`
        this.config = {
            exchanges: config.exchanges,
            exchangeInfo: config.exchangeInfo,
            strategy: new config.strategy(config.base, config.quote, config.strategyConfig),
            base: config.base,
            quote: config.quote
        }
    }

    buildExchanges(exchangesIDs) {
        let exchanges = {}
        for(var id of exchangesIDs) {
            let info = this.exchangeInfo(id)
            let exchangeDelegate = factory.getExchangeDelegate(info, this.debug)
            StreamService.instance.register(info, this.symbol)
            exchanges[id] = this.createExchange(exchangeDelegate, info)
        }
        return exchanges
    }

    buildExchangesSim(exchangeAccount) {
        let exchanges = {}
        for(var id in exchangeAccount) {
            let info = this.exchangeInfo(id)
            let exchangeDelegate = factory.getExchangeDelegateSim(info, this.parseBalance(exchangeAccount[id]), this.debug)
            StreamService.instance.register(info, this.symbol)
            exchanges[id] = this.createExchange(exchangeDelegate, info)
        }
        return exchanges
    }

    createExchange(exchangeDelegate, info) {
        return new Exchange(exchangeDelegate, info, this.config.base, this.config.quote, this.debug)
    }

    get strategy() {
        return this.config.strategy
    }

    get exchanges() {
        return this.config.exchanges
    }

    exchangeInfo(id) {
        var id = id.toLowerCase()
        var info = this.config.exchangeInfo[id]
        if(!info) {
            throw new Error(`exchange ${id} not found in trade ${this.key}`)
        }
        info.id = id
        return info
    }

    parseBalance(data) {
        return {
            [this.config.base]: data.base,
            [this.config.quote]: data.quote,
        }
    }

    get symbol() {
        return `${this.config.base}/${this.config.quote}`
    }
}

module.exports = TradeBuilder