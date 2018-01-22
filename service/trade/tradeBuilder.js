const util = require ('../../util/util.js')
const tradeConfig = require('../../config/tradeConfig')
const backtestConfig = require('../../config/backtestConfig')
const tradeAllConfig = require('../../config/tradeAllConfig')
const Exchange = require('../exchange.js')
const ExchangeStream = require('../exchangeStream')
const factory = require ('../API/exchangeFactory.js')

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
            strategy: new config.strategy(config.base, config.quote, config.strategyConfig)
        }
    }

    buildExchanges(exchangesIDs) {
        let exchanges = {}
        for(var id of exchangesIDs) {
            let info = this.exchangeInfo(id)
            let exchangeDelegate = factory.createExchange(info, this.debug)
            exchanges[id] = new Exchange(exchangeDelegate, info, this.strategy.crypto, this.strategy.fiat, this.debug)
        }
        return exchanges
    }

    buildExchangesSim(exchangeAccount, useStream=false) {
        let exchanges = {}
        for(var id in exchangeAccount) {
            let info = this.exchangeInfo(id)
            let exchangeDelegate = factory.createExchangeSim(info, exchangeAccount[id], false, this.debug)
            let exchangeClass = useStream? ExchangeStream: Exchange
            exchanges[id] = new exchangeClass(exchangeDelegate, info, this.strategy.crypto, this.strategy.fiat, this.debug)
        }
        return exchanges
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
}

module.exports = TradeBuilder