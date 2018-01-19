const util = require ('../util/util.js')
const _ = require('lodash')
const allConfig = require('../config/tradeAllConfig')
const allStrategy = require('../strategy/allStrategy')
const Exchange = require('./exchange.js')
const factory = require ('./API/exchangeFactory.js')


class TradeAllBuilder{
    constructor(debug=true){
        this.debug = debug
        this.config = this.buildAllConfig()
    }

    buildAllConfig() {
        let config = {}
        for(let key in allConfig) {
            config[key] = this.buildConfig(key)
        }
        return config
    }

    buildConfig(key) {
        let config = allConfig[key]
        if(!config) throw `trade config for ${key} not found`
        return {
            exchanges: config.exchanges,
            exchangeInfo: config.exchangeInfo,
            strategy: new config.strategy(config.base, config.quote, config.strategyConfig),
            initAccount: this.getInitAccount(config.base, config.quote, config.initAccount)
        }
    }

    getInitAccount(base, quote, initAccount) {
        let account = {}
        account[base] = initAccount.base
        account[quote] = initAccount.quote
        return account
    }

    buildAllExchanges() {
        let exchangeSet = {}
        for(let key in this.config) {
            let exchanges = this.buildExchanges(key, this.config[key])
            exchangeSet[key] = exchanges
        }
        return exchangeSet
    }

    buildExchangesById(exchangeSet) {
        let exchangeById = {}
        for(let symbol in exchangeSet) {
            let exchanges = exchangeSet[symbol]
            for(let id in exchanges) {
                if(!exchangeById[id]) {
                    exchangeById[id] = {
                        symbols: []
                    }
                }
                exchangeById[id][symbol] = exchanges[id]
                exchangeById[id]['symbols'].push(symbol)
            }
        }
        return exchangeById
    }

    buildExchanges(key, config) {
        let exchanges = {}, initAccount = config.initAccount
        for(var id of config.exchanges) {
            let info = this.exchangeInfo(key, id)
            let exchangeDelegate = factory.createExchangeSim(info, initAccount, false, this.debug)
            exchanges[id] = new Exchange(exchangeDelegate, info, config.strategy.crypto, config.strategy.fiat, this.debug)
        }
        return exchanges
    }

    exchangeInfo(key, id) {
        var id = id.toLowerCase()
        var info = this.config[key].exchangeInfo[id]
        if(!info) {
            throw new Error(`exchange ${id} not found in trade ${key}`)
        }
        info.id = id
        return info
    }

    get strategy() {
        return new allStrategy()
    }

    // buildExchanges(exchangesIDs) {
    //     return this._buildExchanges(exchangesIDs)
    // }
    //
    // buildExchangesSim(exchangeAccount) {
    //     return this._buildExchanges(exchangeAccount, true)
    // }
    //
    // _buildExchanges(exchangesIDs, isSim=false) {
    //     let exchanges = {}
    //     for(var id in exchangesIDs) {
    //         let exchangeDelegate, info
    //         if(isSim) {
    //             info = this.exchangeInfo(id)
    //             exchangeDelegate = factory.createExchangeSim(info, exchangesIDs[id], false, this.debug)
    //         }else {
    //             info = this.exchangeInfo(exchangesIDs[id])
    //             exchangeDelegate = factory.createExchange(info, this.debug)
    //         }
    //         exchanges[id] = new Exchange(exchangeDelegate, info, this.strategy.crypto, this.strategy.fiat, this.debug)
    //     }
    //     return exchanges
    // }

    // get strategy() {
    //     return this.config.strategy
    // }
    //
    // get exchanges() {
    //     return this.config.exchanges
    // }
}

module.exports = TradeAllBuilder