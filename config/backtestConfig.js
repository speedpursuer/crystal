const exchangeInfoBCH = require('./exchangeInfo/exchangeInfo_bch.js')
const exchangeInfoETH = require('./exchangeInfo/exchangeInfo_eth.js')
const exchangeInfoXMR = require('./exchangeInfo/exchangeInfo_xmr.js')
const exchangeInfoXRP = require('./exchangeInfo/exchangeInfo_xrp.js')
const exchangeInfoCommon = require('./exchangeInfo/exchangeInfo_common.js')

const Hedge = require('../strategy/hedge.js')
const StaHedge = require('../strategy/staHedge.js')
const HedgeTest = require('../strategy/hedgeNew.js')

const backtestConfig = {
    'Backtest_BTC/USD': {
        base: "BTC",
        quote: "USD",
        exchanges: ['okex', 'huobipro', 'quoine', 'zb'],
        exchangeInfo: exchangeInfoBCH,
        strategy: HedgeTest,
        strategyConfig: {
            maxAmountOnce: 0.5,
            orderRate: 0.1,
            minMargin: 10,
            maxLoss: -10,
            debug: false
        },
    },

    'Backtest_BCH/BTC': {
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
            debug: false
        },
    },

    'Backtest_ETH/BTC': {
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
            debug: false
        }
    },

    'Backtest_LTC/BTC': {
        base: "LTC",
        quote: "BTC",
        exchanges: ['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'okex'],
        exchangeInfo: exchangeInfoXRP,
        strategy: HedgeTest,
        strategyConfig: {
            maxAmountOnce: 1,
            orderRate: 0.1,
            minMargin: 0.00001,
            maxLoss: -0.001,
            debug: false
        },
    },

    'Backtest_XMR/BTC': {
        base: "XMR",
        quote: "BTC",
        exchanges: ['hitbtc', 'Poloniex', 'Bitfinex', 'Binance'],
        exchangeInfo: exchangeInfoXMR,
        strategy: HedgeTest,
        strategyConfig: {
            maxAmountOnce: 1,
            orderRate: 0.1,
            minMargin: 0.0001,
            maxLoss: -0.001,
            debug: false
        },
    },

    'Backtest_DASH/BTC': {
        base: "DASH",
        quote: "BTC",
        exchanges: ['hitbtc', 'Binance', 'Poloniex', 'Bittrex', 'Bitfinex'],
        exchangeInfo: exchangeInfoCommon,
        strategy: HedgeTest,
        strategyConfig: {
            maxAmountOnce: 1,
            orderRate: 0.1,
            minMargin: 0.0001,
            maxLoss: -0.001,
            debug: false
        },
    },

    'Backtest_XRP/BTC': {
        base: "XRP",
        quote: "BTC",
        exchanges: ['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'bitstamp'],
        exchangeInfo: exchangeInfoCommon,
        strategy: HedgeTest,
        strategyConfig: {
            maxAmountOnce: 15,
            orderRate: 0.1,
            minMargin: 0.000001,
            maxLoss: -0.001,
            debug: false
        },
    },

    'Backtest_IOTA/BTC': {
        base: "IOTA",
        quote: "BTC",
        exchanges: ['Bitfinex', 'Binance', 'OKEx'],
        exchangeInfo: exchangeInfoCommon,
        strategy: HedgeTest,
        strategyConfig: {
            maxAmountOnce: 15,
            orderRate: 0.1,
            minMargin: 0.000001,
            maxLoss: -0.001,
            debug: false
        },
    },

    'Backtest_EOS/BTC': {
        base: "EOS",
        quote: "BTC",
        exchanges: ['Bitfinex', 'Binance', 'huobipro', 'OKEx', 'hitbtc', 'zb'],
        exchangeInfo: exchangeInfoCommon,
        strategy: HedgeTest,
        strategyConfig: {
            maxAmountOnce: 15,
            orderRate: 0.1,
            minMargin: 0.000002,
            maxLoss: -0.001,
            debug: false
        },
    },


    'Backtest_QTUM/BTC': {
        base: "QTUM",
        quote: "BTC",
        exchanges: ['Bittrex', 'Bitfinex', 'Binance', 'OKEx', 'huobipro'],
        exchangeInfo: exchangeInfoCommon,
        strategy: HedgeTest,
        strategyConfig: {
            maxAmountOnce: 10,
            orderRate: 0.1,
            minMargin: 0.000005,
            maxLoss: -0.001,
            debug: false
        },
    },
}

module.exports = backtestConfig