var exchangeInfo = {
    OrderBookStreamHuobi: {
		url: 'wss://api.huobi.pro/ws',
        symbolPairs: {
			'EOS/BTC': 'eosbtc',
			'ETH/BTC': 'ethbtc',
		},
        needPing: true
	},

    OrderBookStreamOkex: {
        url: 'wss://real.okex.com:10441/websocket',
        symbolPairs: {
            'EOS/BTC': 'eos_btc',
            'IOTA/BTC': 'IOTA_btc',
            'ETH/BTC': 'eth_btc'
        },
        needPing: true
    },

    OrderBookStreamBitfinex: {
        url: 'wss://api.bitfinex.com/ws/2',
        symbolPairs: {
            'EOS/BTC': 'tEOSBTC',
            'IOTA/BTC': 'tIOTBTC',
            'ETH/BTC': 'tETHBTC'
        },
        needPing: true
    },

    OrderBookStreamBinance: {
        url: 'wss://stream.binance.com:9443/stream?streams=',
        symbolPairs: {
            'EOS/BTC': 'eosbtc',
            'IOTA/BTC': 'iotabtc',
            'ETH/BTC': 'ethbtc',
            'BTC/USD': 'btcusdt',
            'ETH/USD': 'ethusdt',
        },
        needPing: false
    },
}

module.exports = exchangeInfo