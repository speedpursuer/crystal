var exchangeInfo = {
    StreamHuobi: {
		url: 'wss://api.huobi.pro/ws',
        symbolPairs: {
			'EOS/BTC': 'eosbtc',
			'ETH/BTC': 'ethbtc',
            'BCH/BTC': 'bchbtc',
            'BTC/USDT': 'btcusdt'
		},
        needPing: true
	},

    StreamOkex: {
        url: 'wss://real.okex.com:10441/websocket',
        symbolPairs: {
            'EOS/BTC': 'eos_btc',
            'IOTA/BTC': 'iota_btc',
            'ETH/BTC': 'eth_btc',
            'BCH/BTC': 'bch_btc',
            'BTC/USDT': 'bch_usdt',
        },
        needPing: true
    },

    StreamBitfinex: {
        url: 'wss://api.bitfinex.com/ws/2',
        symbolPairs: {
            'EOS/BTC': 'tEOSBTC',
            'IOTA/BTC': 'tIOTBTC',
            'ETH/BTC': 'tETHBTC',
            'BCH/BTC': 'tBCHBTC',
            'BTC/USDT': 'tBTCUSDT',
        },
        needPing: true
    },

    StreamBinance: {
        url: 'wss://stream.binance.com:9443/stream?streams=',
        symbolPairs: {
            'EOS/BTC': 'eosbtc',
            'IOTA/BTC': 'iotabtc',
            'ETH/BTC': 'ethbtc',
            'BCH/BTC': 'bccbtc',
            'BTC/USD': 'btcusdt',
            'ETH/USD': 'ethusdt',
        },
        needPing: true
    },

    StreamBittrex: {
        symbolPairs: {
            'ETH/BTC': 'BTC-ETH',
            'BCH/BTC': 'BTC-BCC',
            'BTC/USDT': 'USDT-BTC',
        },
        needPing: true
    },
}

module.exports = exchangeInfo