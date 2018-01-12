const exchangeInfo = require('./exchangeInfo/exchangeInfo_usdt.js')
const exchangeInfoBCH = require('./exchangeInfo/exchangeInfo_bch.js')
const exchangeInfoETH = require('./exchangeInfo/exchangeInfo_eth.js')
const exchangeInfoXMR = require('./exchangeInfo/exchangeInfo_xmr.js')
const exchangeInfoEOS = require('./exchangeInfo/exchangeInfo_eos.js')

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
        exchanges: ['okex', 'Bitfinex', 'Bittrex', 'binance', 'hitbtc'],
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
            minMargin: 0.00004,
            maxLoss: -0.001,
            debug: true
        }
    },

    'EOS/BTC': {
        base: "EOS",
        quote: "BTC",
        exchanges: ['Binance', 'huobipro', 'OKEx'],
        // exchanges: ['Bitfinex', 'Binance', 'huobipro', 'OKEx'],
        exchangeInfo: exchangeInfoEOS,
        strategy: HedgeTest,
        strategyConfig: {
            maxAmountOnce: 15,
            orderRate: 0.1,
            minMargin: 0.000004,
            maxLoss: -0.001,
            debug: false
        },
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
}

module.exports = tradeConfig