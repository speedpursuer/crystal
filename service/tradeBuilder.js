const util = require ('../util/util.js')
const tradeConfig = require('../config/tradeConfig')
const backtestConfig = require('../config/backtestConfig')
const Exchange = require('./exchange.js')
const factory = require ('./API/exchangeFactory.js')

class TradeBuilder{
    constructor(key, debug=true){
        this.key = key
        this.debug = debug
        this.config = this.buildConfig(key)
    }

    buildConfig(key) {
        let allConfig = Object.assign(tradeConfig, backtestConfig);
        let config = allConfig[key]
        if(!config) throw `trade config for ${key} not found`
        return {
            exchanges: config.exchanges,
            exchangeInfo: config.exchangeInfo,
            strategy: new config.strategy(config.base, config.quote, config.strategyConfig)
        }
    }

    buildExchanges(exchangesIDs) {
        return this._buildExchanges(exchangesIDs)
    }

    buildExchangesSim(exchangesIDs, initBalance, initStocks) {
        return this._buildExchanges(exchangesIDs, initBalance, initStocks)
    }

    _buildExchanges(exchangesIDs, initBalance=null, initStocks=null) {
        if(!util.isArray(exchangesIDs)) throw "exchangesIDs should be an array"
        let exchanges = {}
        for(var id of exchangesIDs) {
            let info = this.exchangeInfo(id)
            let exchangeDelegate
            if(initBalance && initStocks) {
                exchangeDelegate = factory.createExchangeSim(info, this.strategy.crypto, this.strategy.fiat, initBalance, initStocks, false, this.debug)
            }else {
                exchangeDelegate = factory.createExchange(info, this.debug)
            }
            exchanges[id] = new Exchange(exchangeDelegate, info, this.strategy.crypto, this.strategy.fiat, this.debug)
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
            throw `exchange ${id} not found in trade ${this.key}`
        }
        info.id = id
        return info
    }
}

module.exports = TradeBuilder