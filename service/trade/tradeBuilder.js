const util = require ('../../util/util.js')
const tradeConfig = require('../../config/tradeConfig')
const backtestConfig = require('../../config/backtestConfig')
const tradeAllConfig = require('../../config/tradeAllConfig')
const Exchange = require('../exchange/exchange.js')
const ExchangeStream = require('../exchange/exchangeStream')
const factory = require ('../API/exchangeDelegateFactory.js')


class TradeBuilder{
    constructor(key, debug=true){
        this.key = key
        this.debug = debug
        this.config = this.buildConfig(key)
    }

    buildConfig(key) {
        let allConfig = Object.assign(tradeConfig, backtestConfig, tradeAllConfig)
        let config = allConfig[key]
        if(!config) throw `trade config for ${key} not found`
        return {
            exchanges: config.exchanges,
            exchangeInfo: config.exchangeInfo,
            strategy: new config.strategy(config.base, config.quote, config.strategyConfig),
            base: config.base,
            quote: config.quote
        }
    }

    buildExchanges(exchangesIDs, useStream=false) {
        let exchanges = {}
        for(var id of exchangesIDs) {
            let info = this.exchangeInfo(id)
            let exchangeDelegate = factory.createExchangeDelegate(info, this.debug)
            exchanges[id] = this.createExchange(exchangeDelegate, info, useStream)
        }
        return exchanges
    }

    buildExchangesSim(exchangeAccount, useStream=false) {
        let exchanges = {}
        for(var id in exchangeAccount) {
            let info = this.exchangeInfo(id)
            let exchangeDelegate = factory.createExchangeDelegateSim(info, this.parseBalance(exchangeAccount[id]), false, this.debug)
            exchanges[id] = this.createExchange(exchangeDelegate, info, useStream)
        }
        return exchanges
    }

    createExchange(exchangeDelegate, info, useStream=false) {
        let exchangeClass = useStream? ExchangeStream: Exchange
        return new exchangeClass(exchangeDelegate, info, this.strategy.crypto, this.strategy.fiat, this.debug)
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
}

module.exports = TradeBuilder