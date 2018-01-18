const OrderBookHuobi = require('../service/stream/orderbookHuobi')
const OrderBookOkex = require('../service/stream/orderbookOkex')
const OrderBookBitfinex = require('../service/stream/orderbookBitfinex')
const OrderBookBinance = require('../service/stream/orderbookBinance')
const util = require('../util/util.js')
const should = require('should')
const binance = require('node-binance-api')


describe('测试Orderbook stream', async function() {

    this.timeout(50000)

    before(async function() {

	})

	afterEach(async function(){
		
	})

	describe.only('huobi', async function() {
    	it('查询订单簿数据', async function() {
            let orderBook = new OrderBookHuobi(['EOS/BTC', 'ETH/BTC'])
			for(let i=0; i<20; i++) {
                util.log(orderBook.getOrderBookBySymbol('EOS/BTC'))
                util.log(orderBook.getOrderBookBySymbol('ETH/BTC'))
                await util.sleep(1000)
			}
    	})
  	})

    describe.only('okex', async function() {
        it('查询订单簿数据', async function() {
            let orderBook = new OrderBookOkex(['EOS/BTC', 'ETH/BTC'])
            for(let i=0; i<20; i++) {
                util.log(orderBook.getOrderBookBySymbol('EOS/BTC'))
                util.log(orderBook.getOrderBookBySymbol('ETH/BTC'))
                await util.sleep(1000)
            }
        })
    })

    describe.only('Bitfinex', async function() {
        it('查询订单簿数据', async function() {
            let orderBook = new OrderBookBitfinex(['EOS/BTC', 'ETH/BTC'])
            for(let i=0; i<20; i++) {
                util.log('EOS/BTC', orderBook.getOrderBookBySymbol('EOS/BTC'))
                util.log('ETH/BTC', orderBook.getOrderBookBySymbol('ETH/BTC'))
                await util.sleep(1000)
            }
        })
    })

    describe.only('Binance', async function() {
        it('查询订单簿数据', async function() {

            let orderBook = new OrderBookBinance(['BTC/USD', 'ETH/USD'])
            // let orderBook = new OrderBookBinance(['EOS/BTC', 'ETH/BTC'])
            for(let i=0; i<20; i++) {
                util.log('EOS/BTC', orderBook.getOrderBookBySymbol('BTC/USD'))
                util.log('ETH/BTC', orderBook.getOrderBookBySymbol('ETH/USD'))
                await util.sleep(1000)
            }

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
    })

})

