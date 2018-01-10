const should = require('should');
const MongoDB = require('../service/mongoDB.js')
const RedisDB = require('../service/redisDB.js')
const util = require('../util/util.js')
const _ = require('lodash')

describe('测试Database class', async function() {

	let curreData, mongo, redis

	before(async function() {
        mongo = new MongoDB('localhost', 'test', null, null, null)
        redis = await RedisDB.getInstanceWithAccount(1000, 1, ['k', 'p'])
	})

    after(async function() {
        await redis.deleteData()
    })

	// afterEach(async function(){
	// 	util.log("CurreData", curreData)
	// })

    describe.only('recordTrade', async function() {
  	    it('可以保存交易记录', async function() {
    		await redis.recordTrade('k', 'p', 5000, 0.56)
    		curreData = await redis.getData()
    		curreData.details.length.should.equal(1)
  	    })
	})

	describe.only('recordBalance', async function() {
  	    it('交易结果不应该为0', async function() {
            await redis.recordBalance(0.01, 50, -1)
            curreData = await redis.getData()
            curreData.balanceGap.should.equal(50)
  	    })
	})

    describe.only('recordOrderBook', async function() {
        it('保存orderbook', async function() {
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
    })

    describe.only('getOrderBooks', async function() {
        it('获取时间条数', async function() {
            var result = await mongo.getOrderBooksTimeline('1509021522000', '1509021545000')
            util.log(result.length)
            result = await mongo.getOrderBooks('BTC/USD', ['bitstamp', 'lakebtc', 'bitfinex'], 0, util.timestamp)
            util.log("got data")
        })
    })

    describe.only('保存redis', async function () {
        it('成功', async function () {
            var data = []
            await redis.saveDataWithKey(data, 'XMR')
        })
    })

    describe.only('保存API故障', async function () {
        it('成功', async function () {
            await redis.recordClosedAPI('okex')
            curreData = await redis.getData()
            util.log(curreData.closedAPIs)
            curreData.closedAPIs.length.should.equal(1)
        })
    })
})