const exchangeInfo = require('../config/exchangeInfo.js')
const exchangeInfoBCH = require('../config/exchangeInfo_bch.js')
const exchangeInfoETH = require('../config/exchangeInfo_eth.js')
const exchangeInfoXMR = require('../config/exchangeInfo_xmr.js')

const Hedge = require('../strategy/hedge.js')
const StaHedge = require('../strategy/staHedge.js')
const HedgeTest = require('../strategy/hedgeTest.js')

const tradeConfig = {
    'BTC/USD': {
        exchanges: ['okex', 'huobipro', 'quoine', 'zb'],
        exchangeInfo: exchangeInfo,
        strategy: HedgeTest,
        strategyConfig: {
            maxAmountOnce: 0.5,
            orderRate: 0.1,
            minMargin: 10,
            maxLoss: -10,
            debug: true
        }
    },

    'BCH/BTC': {
        base: "BCH",
        quote: "BTC",
        exchanges: ['okex', 'Bitfinex', 'huobipro', 'Bittrex', 'binance'],
        exchangeInfo: exchangeInfoBCH,
        strategy: HedgeTest,
        strategyConfig: {
            maxAmountOnce: 1,
            orderRate: 0.1,
            minMargin: 0.0001,
            maxLoss: -0.001,
            debug: true
        }
    },

    'ETH/BTC': {
        base: "ETH",
        quote: "BTC",
        exchanges: ['okex', 'huobipro', 'Bitfinex', 'Bittrex', 'hitbtc', 'binance'],
        exchangeInfo: exchangeInfoETH,
        strategy: HedgeTest,
        strategyConfig: {
            maxAmountOnce: 1,
            orderRate: 0.1,
            minMargin: 0.00002,
            maxLoss: -0.001,
            debug: true
        }
    },

    'XMR/BTC': {
        base: "XMR",
        quote: "BTC",
        exchanges: ['hitbtc', 'Poloniex', 'Bitfinex', 'Binance'],
        exchangeInfo: exchangeInfoXMR,
        strategy: HedgeTest,
        strategyConfig: {
            maxAmountOnce: 1,
            orderRate: 0.1,
            minMargin: 0.00003,
            maxLoss: -0.001,
            debug: true
        }
    },

    'Backtest_BCH/BTC': {
        base: "BCH",
        quote: "BTC",
        exchanges: ['okex', 'Bitfinex', 'huobipro', 'Bittrex', 'binance'],
        exchangeInfo: exchangeInfoBCH,
        strategy: HedgeTest,
        strategyConfig: {
            maxAmountOnce: 1,
            orderRate: 0.1,
            minMargin: 0.0001,
            maxLoss: -0.001,
            debug: false
        },
    },
}

class TradeConfig{
    constructor(key){
        this.key = key
        this.config = this.buildConfig(key)
    }

    buildConfig(key) {
        let config = tradeConfig[key]
        if(!config) throw `trade config for ${key} not found`
        return {
            exchanges: config.exchanges,
            exchangeInfo: config.exchangeInfo,
            strategy: new config.strategy(config.base, config.quote, config.strategyConfig)
        }
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

module.exports = TradeConfig