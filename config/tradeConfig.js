const exchangeInfo = require('./exchangeInfo/exchangeInfo_usdt.js')
const exchangeInfoBCH = require('./exchangeInfo/exchangeInfo_bch.js')
const exchangeInfoETH = require('./exchangeInfo/exchangeInfo_eth.js')
const exchangeInfoXMR = require('./exchangeInfo/exchangeInfo_xmr.js')
const exchangeInfoEOS = require('./exchangeInfo/exchangeInfo_eos.js')
const exchangeInfoIOTA = require('./exchangeInfo/exchangeInfo_iota.js')

const Hedge = require('../strategy/hedge.js')
const StaHedge = require('../strategy/staHedge.js')
const HedgeNew = require('../strategy/hedgeNew')

const tradeConfig = {
    'BTC/USD': {
        exchanges: ['okex', 'huobipro', 'quoine', 'zb'],
        exchangeInfo: exchangeInfo,
        strategy: HedgeNew,
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
        exchanges: ['okex', 'Bitfinex', 'Bittrex', 'binance'],
        // exchanges: ['okex', 'Bitfinex', 'Bittrex', 'binance', 'hitbtc'],
        exchangeInfo: exchangeInfoBCH,
        strategy: HedgeNew,
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
        exchanges: ['okex', 'huobipro', 'Bitfinex', 'Bittrex', 'binance'],
        exchangeInfo: exchangeInfoETH,
        strategy: HedgeNew,
        strategyConfig: {
            maxAmountOnce: 1,
            orderRate: 0.1,
            minMargin: 0.00004,
            maxLoss: -0.001,
            debug: true
        }
    },

    'EOS/BTC': {
        base: "EOS",
        quote: "BTC",
        exchanges: ['Bitfinex', 'Binance', 'huobipro', 'OKEx'],
        exchangeInfo: exchangeInfoEOS,
        strategy: HedgeNew,
        strategyConfig: {
            maxAmountOnce: 30,
            orderRate: 0.1,
            minMargin: 0.000004,
            maxLoss: -0.001,
            debug: true
        },
    },

    'IOTA/BTC': {
        base: "IOTA",
        quote: "BTC",
        exchanges: ['Bitfinex', 'Binance', 'OKEx'],
        exchangeInfo: exchangeInfoIOTA,
        strategy: HedgeNew,
        strategyConfig: {
            maxAmountOnce: 30,
            orderRate: 0.1,
            minMargin: 0.000001,
            maxLoss: -0.001,
            debug: true
        },
    },

    // 'XMR/BTC': {
    //     base: "XMR",
    //     quote: "BTC",
    //     exchanges: ['hitbtc', 'Poloniex', 'Bitfinex', 'Binance'],
    //     exchangeInfo: exchangeInfoXMR,
    //     strategy: HedgeNew,
    //     strategyConfig: {
    //         maxAmountOnce: 1,
    //         orderRate: 0.1,
    //         minMargin: 0.00003,
    //         maxLoss: -0.001,
    //         debug: true
    //     }
    // },
}

module.exports = tradeConfig