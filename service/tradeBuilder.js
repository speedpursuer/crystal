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

    buildExchangesSim(exchangeAccount) {
        return this._buildExchanges(exchangeAccount, true)
    }

    _buildExchanges(exchangesIDs, isSim=false) {
        let exchanges = {}
        for(var id in exchangesIDs) {
            let exchangeDelegate, info
            if(isSim) {
                info = this.exchangeInfo(id)
                exchangeDelegate = factory.createExchangeSim(info, exchangesIDs[id], false, this.debug)
            }else {
                info = this.exchangeInfo(exchangesIDs[id])
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
            throw new Error(`exchange ${id} not found in trade ${this.key}`)
        }
        info.id = id
        return info
    }
}

module.exports = TradeBuilder