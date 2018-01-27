const should = require('should');
const MongoDB = require('../service/db/mongoDB.js')
const TradeLog = require('../service/db/tradeLog')
const ApiLog = require('../service/db/appLog')
const util = require('../util/util.js')
const _ = require('lodash')

describe('测试Database class', async function() {

	let curreData, mongo, trade

	before(async function() {
        mongo = new MongoDB('localhost', 'test', null, null, null)
        trade = new TradeLog()
        await trade.init(1000, 1, ['k', 'p'])
	})

    after(async function() {
        await trade.deleteData()
    })

	afterEach(async function(){
		util.log("CurreData", curreData)
	})

    describe.only('Redis', async function() {
  	    it('recordTrade', async function() {
    		await trade.recordTrade('k', 'p', 'Good', 'Good', 5000, 0.56)
    		curreData = await trade.getData()
    		curreData.details.length.should.equal(1)
  	    })

        it('recordBalance', async function() {
            await trade.recordBalance(0.01, 50, -1)
            curreData = await trade.getData()
            curreData.balanceGap.should.equal(50)
        })

        it('recordStopped', async function() {
            await trade.recordStopped('Loss money')
            curreData = await trade.getData()
            curreData.stopped.should.not.equal(null)
        })

        it('保存API故障', async function () {
            let apiLog = ApiLog.instance
            await apiLog.recordClosedAPI('okex')
            curreData = await apiLog.getData()
            util.log(curreData.closedAPIs)
            curreData.closedAPIs.length.should.equal(1)
        })
	})

    describe.only('MongoDB', async function() {
        it('recordOrderBook', async function() {
            var data = {
                timestamp: 1508932164960,
                bids: [ [5509.6, 1.69],
                          [5509.5, 0.5],
                          [5509, 0.033733],
                          [5508.9, 3.63048884],
                          [5508.5, 0.05497499],
                          [5508.5, 0.05497499],
                          [5508.5, 0.05497499],
                          [5508.5, 0.05497499], ],
                asks: [ [5509.7, 5.675649],
                          [5511, 0.013493],
                          [5511.1, 5.89199391],
                          [5511.7, 0.01352391],
                          [5512, 0.01],
                          [5512, 0.01],
                          [5512, 0.01],  ],
                datetime: util.now,
            }
            data.bids = _.slice(data.bids, 0, 5)
            data.asks = _.slice(data.asks, 0, 5)
            // await util.sleep(1000)
            await mongo.recordOrderBook(data)
            var result = await mongo.getAllOrderBooks()
            for(var book of result) {
                book.should.have.property('bids')
                util.log(book.bids)
                util.log(book.asks)
            }
        })

        it('getOrderBooks', async function() {
            var result = await mongo.getOrderBooksTimeline('1509021522000', '1509021545000')
            util.log(result.length)
            result = await mongo.getOrderBooks('BTC/USD', ['bitstamp', 'lakebtc', 'bitfinex'], 0, util.timestamp)
            util.log("got data")
        })
    })
})