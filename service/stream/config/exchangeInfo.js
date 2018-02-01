var exchangeInfo = {
    OrderBookStreamHuobi: {
		url: 'wss://api.huobi.pro/ws',
        symbolPairs: {
			'EOS/BTC': 'eosbtc',
			'ETH/BTC': 'ethbtc',
            'BCH/BTC': 'bchbtc',
            'BTC/USDT': 'btcusdt'
		},
        needPing: true
	},

    OrderBookStreamOkex: {
        url: 'wss://real.okex.com:10441/websocket',
        symbolPairs: {
            'EOS/BTC': 'eos_btc',
            'IOTA/BTC': 'IOTA_btc',
            'ETH/BTC': 'eth_btc',
            'BCH/BTC': 'bch_btc',
            'BTC/USDT': 'bch_usdt',
        },
        needPing: true
    },

    OrderBookStreamBitfinex: {
        url: 'wss://api.bitfinex.com/ws/2',
        symbolPairs: {
            'EOS/BTC': 'tEOSBTC',
            'IOTA/BTC': 'tIOTBTC',
            'ETH/BTC': 'tETHBTC',
            'BCH/BTC': 'tBCHBTC',
        },
        needPing: true
    },

    OrderBookStreamBinance: {
        url: 'wss://stream.binance.com:9443/stream?streams=',
        symbolPairs: {
            'EOS/BTC': 'eosbtc',
            'IOTA/BTC': 'iotabtc',
            'ETH/BTC': 'ethbtc',
            'BCH/BTC': 'bccbtc',
            'BTC/USD': 'btcusdt',
            'ETH/USD': 'ethusdt',
        },
        needPing: false
    },

    OrderBookStreamBittrex: {
        symbolPairs: {
            'ETH/BTC': 'BTC-ETH',
            'BCH/BTC': 'BTC-BCC',
            'BTC/USDT': 'USDT-BTC',
        },
    },
}

module.exports = exchangeInfo