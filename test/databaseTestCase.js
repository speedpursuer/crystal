const should = require('should');
const database = require('../service/database.js')
const util = require('../util/util.js')
const _ = require('lodash')

describe.skip('测试Database class', async function() {

	// var database = new Database('Test')
	var curreData

	before(async function() {		
		await database.initAccount('database test case', 1000, 1, ['k', 'p'])
	})

  after(async function() {
    await database.deleteData()
  })

	// afterEach(async function(){
	// 	util.log("CurreData", curreData)
	// })

  describe('recordTrade', async function() {  		
  	it('可以保存交易记录', async function() {    		      		
    		await database.recordTrade('k', 'p', 5000, 0.56)
    		curreData = await database.getData()      
    		curreData.details.length.should.equal(1)
  	})
	})

	describe('recordBalance', async function() {  		
  	it('交易结果不应该为0', async function() {
  		await database.recordBalance(50, -1)
  		curreData = await database.getData()
  		curreData.balanceGap.should.equal(50)
  	})
	})

  describe.skip('recordOrderBook', async function() {      
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
      await database.recordOrderBook(data)
      var result = await database.getOrderBook()
      for(var book of result) {
        book.should.have.property('bids')
        util.log(book.bids)
        util.log(book.asks)
      }
    })
  })

  describe.only('getOrderBooks', async function() {      
    it('获取时间条数', async function() {
      var result = await database.getOrderBooksTimeline('1509021522000', '1509021545000')
      util.log(result.length)

      // result = await database.getOrderBooks('bitstamp', '1509021545000')
      // util.log(result.length)
      
      result = await database.getOrderBooks2('BTC/USD', ['bitstamp', 'lakebtc', 'bitfinex'], 0, util.timestamp)
      util.log("got data")
    })
  })
})