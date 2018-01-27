const exchangeInfo = require('./exchangeInfo/exchangeInfo_usdt.js')
const exchangeInfoBCH = require('./exchangeInfo/exchangeInfo_bch.js')
const exchangeInfoETH = require('./exchangeInfo/exchangeInfo_eth.js')
const exchangeInfoXMR = require('./exchangeInfo/exchangeInfo_xmr.js')
const exchangeInfoEOS = require('./exchangeInfo/exchangeInfo_eos.js')
const exchangeInfoCommon = require('./exchangeInfo/exchangeInfo_common.js')

const Hedge = require('../strategy/hedge.js')
const StaHedge = require('../strategy/staHedge.js')
const HedgeNew = require('../strategy/hedgeNew')

const tradeAllConfig = {

    'All_EOS/BTC': {
        base: "EOS",
        quote: "BTC",
        exchanges: ['Bitfinex', 'Binance', 'huobipro', 'OKEx'],
        exchangeInfo: exchangeInfoEOS,
        strategy: HedgeNew,
        strategyConfig: {
            maxAmountOnce: 20,
            orderRate: 0.1,
            minMargin: 0.000004,
            maxLoss: -0.001,
            debug: true
        },
        initAccount: {
            base: 840,
            quote: 1
        }
    },

    'All_IOTA/BTC': {
        base: "IOTA",
        quote: "BTC",
        exchanges: ['Bitfinex', 'Binance', 'OKEx'],
        exchangeInfo: exchangeInfoCommon,
        strategy: HedgeNew,
        strategyConfig: {
            maxAmountOnce: 20,
            orderRate: 0.1,
            minMargin: 0.000001,
            maxLoss: -0.001,
            debug: true
        },
        initAccount: {
            base: 4444,
            quote: 1
        }
    },

    // 'All_ETH/BTC': {
    //     base: "ETH",
    //     quote: "BTC",
    //     exchanges: ['okex', 'huobipro', 'Bitfinex', 'binance'],
    //     // exchanges: ['okex', 'huobipro', 'Bitfinex', 'Bittrex', 'hitbtc', 'binance'],
    //     exchangeInfo: exchangeInfoETH,
    //     strategy: HedgeNew,
    //     strategyConfig: {
    //         maxAmountOnce: 1,
    //         orderRate: 0.1,
    //         minMargin: 0.00004,
    //         maxLoss: -0.001,
    //         debug: true
    //     },
    //     initAccount: {
    //         base: 11,
    //         quote: 1
    //     }
    // },

    // 'XMR/BTC': {
    //     base: "XMR",
    //     quote: "BTC",
    //     exchanges: ['hitbtc', 'Poloniex', 'Bitfinex', 'Binance'],
    //     exchangeInfo: exchangeInfoCommon,
    //     strategy: HedgeNew,
    //     strategyConfig: {
    //         maxAmountOnce: 1,
    //         orderRate: 0.1,
    //         minMargin: 0.00003,
    //         maxLoss: -0.001,
    //         debug: true
    //     },
    //     initAccount: {
    //         base: 100,
    //         quote: 1
    //     }
    // },
    //
    // 'DASH/BTC': {
    //     base: "DASH",
    //     quote: "BTC",
    //     exchanges: ['hitbtc', 'Binance', 'Poloniex', 'Bittrex', 'Bitfinex'],
    //     exchangeInfo: exchangeInfoCommon,
    //     strategy: HedgeNew,
    //     strategyConfig: {
    //         maxAmountOnce: 1,
    //         orderRate: 0.1,
    //         minMargin: 0.0001,
    //         maxLoss: -0.001,
    //         debug: false
    //     },
    //     initAccount: {
    //         base: 100,
    //         quote: 1
    //     }
    // },
    //
    // 'XRP/BTC': {
    //     base: "XRP",
    //     quote: "BTC",
    //     exchanges: ['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'bitstamp'],
    //     exchangeInfo: exchangeInfoCommon,
    //     strategy: HedgeNew,
    //     strategyConfig: {
    //         maxAmountOnce: 15,
    //         orderRate: 0.1,
    //         minMargin: 0.000001,
    //         maxLoss: -0.001,
    //         debug: false
    //     },
    //     initAccount: {
    //         base: 100,
    //         quote: 1
    //     }
    // },
}

module.exports = tradeAllConfig