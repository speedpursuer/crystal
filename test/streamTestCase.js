const OrderBookHuobi = require('../service/stream/orderbookHuobi')
const OrderBookOkex = require('../service/stream/orderbookOkex')
const OrderBookBitfinex = require('../service/stream/orderbookBitfinex')
const OrderBookBinance = require('../service/stream/orderbookBinance')
const OrderBookBittrex = require('../service/stream/orderbookBittrex')
const util = require('../util/util.js')
const should = require('should')
const binance = require('node-binance-api')


describe('测试Orderbook stream', async function() {

    this.timeout(50000)

    before(async function() {

	})

	afterEach(async function(){
		
	})

	describe.only('查询订单簿数据', async function() {
    	it('huobi', async function() {
            let symbos = ['EOS/BTC', 'ETH/BTC']
            let orderBook = new OrderBookHuobi(symbos)
            connect(orderBook, symbos)
    	})

        it('okex', async function() {
            let symbos = ['EOS/BTC', 'ETH/BTC', 'IOTA/BTC']
            let orderBook = new OrderBookOkex(symbos)
            connect(orderBook, symbos)
        })

        it('Bitfinex', async function() {
            let symbos = ['EOS/BTC', 'ETH/BTC', 'IOTA/BTC']
            let orderBook = new OrderBookBitfinex(symbos)
            connect(orderBook, symbos)
        })

        it('Binance', async function() {
            let symbos = ['BTC/USD', 'ETH/USD', 'IOTA/BTC']
            let orderBook = new OrderBookBinance(symbos)
            connect(orderBook, symbos)
            // let orderBook = new OrderBookBinance(['EOS/BTC', 'ETH/BTC'])
            // binance.options({
            //     'test':true
            // })
            //
            // binance.websockets.depthCache(['BNBBTC'], function(symbol, depth) {
            //     let bids = binance.sortBids(depth.bids);
            //     let asks = binance.sortAsks(depth.asks);
            //     console.log(symbol+" depth cache update");
            //     console.log("bids", bids);
            //     console.log("asks", asks);
            //     console.log("best bid: "+binance.first(bids));
            //     console.log("best ask: "+binance.first(asks));
            // });
        })

        it('Bittrex', async function() {
            let symbos = ['BCH/BTC', 'ETH/BTC']
            let orderBook = new OrderBookBittrex(symbos)
            connect(orderBook, symbos)
        })
  	})
    
    function connect(orderBook, symbos) {
        orderBook.connect()
        orderBook.on('started', async function (flag) {
            if(flag) {
                for(let i=0; i<20; i++) {
                    for(let symbol of symbos) {
                        util.log(symbol, orderBook.getOrderBookBySymbol(symbol))
                    }
                    await util.sleep(1000)
                }
            }else {
                util.log.red(`orderbook NOT all received: ${flag}`)
            }
        })
    }
})

