const StreamHuobi = require('../service/API/ws/streamHuobi')
const StreamOkex = require('../service/API/ws/streamOkex')
const StreamBitfinex = require('../service/API/ws/streamBitfinex')
const StreamBinance = require('../service/API/ws/streamBinance')
const StreamBittrex = require('../service/API/ws/streamBittrex')
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
            let orderBook = new StreamHuobi(symbos)
            connect(orderBook, symbos)
    	})

        it('okex', async function() {
            let symbos = ['EOS/BTC', 'ETH/BTC', 'IOTA/BTC']
            let orderBook = new StreamOkex(symbos)
            connect(orderBook, symbos)
        })

        it('Bitfinex', async function() {
            let symbos = ['EOS/BTC', 'ETH/BTC', 'IOTA/BTC']
            let orderBook = new StreamBitfinex(symbos)
            await connect1(orderBook, symbos)
        })

        it('Binance', async function() {
            let symbos = ['BTC/USD', 'ETH/USD', 'IOTA/BTC']
            let orderBook = new StreamBinance(symbos)
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
            let orderBook = new StreamBittrex(symbos)
            connect(orderBook, symbos)
        })

        it('Bittrex异常处理', async function() {
            let symbos = ['BCH/BTC']
            let orderBook = new StreamBittrex(symbos)
            orderBook.connect()

            for(let i=0; i<200; i++) {
                for(let symbol of symbos) {
                    let orderbook = orderBook.getOrderBookBySymbol(symbol)
                    util.log(symbol, orderbook)
                }

                if(i == 12) {
                    orderBook.marketManager.reset()
                }

                if(i == 22) {
                    orderBook.reconnect('test')
                }

                // if(i == 12) {
                //     orderBook.isOrderbookEmpty = function () {
                //         return true
                //     }
                //     orderBook.reconnect()
                // }

                // if(i == 12) {
                //     orderBook.stopStream()
                // }

                await util.sleep(1000)
            }
        })
  	})
    
    function connect(orderBook, symbos) {
        orderBook.connect()
        orderBook.on('started', async function (flag) {
            if(flag) {
                for(let i=0; i<20; i++) {
                    for(let symbol of symbos) {
                        let orderbook = orderBook.getOrderBookBySymbol(symbol)
                        util.log(symbol, 'buy1: ', orderbook.bids[0], 'sell1', orderbook.asks[0])
                    }
                    await util.sleep(1000)
                }
            }else {
                util.log.red(`orderbook NOT all received: ${flag}`)
            }
        })
    }

    async function connect1(orderBook, symbos) {
        orderBook.connect()
        for(let i=0; i<200; i++) {
            await util.sleep(1000)
        }
    }
})

