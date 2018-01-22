const should = require('should');
const util = require('../util/util.js')
const factory = require ('../service/API/exchangeFactory.js')
const TradeBuilder = require('../service/trade/tradeBuilder')


describe('单元测试ExchangeDelegate', async function() {

	this.timeout(50000)

    var exchangeDelegate
    var exchange = 'bitfinex'
    var base = "EOS", quote = "BTC"
    var symbol = `${base}/${quote}`
    var balance = {}

	before(async function() {
        let traderBuilder = new TradeBuilder(symbol)
        let info = traderBuilder.exchangeInfo(exchange)

        factory.exchangeDelegateConfig = {
            failureInterval: 4000,
            failureThreshold: 2,
            retryDelay: 1000,
            retryInterval: 60 * 1000,
            retryThreshold: 2
        }

        exchangeDelegate = factory.createExchange(info, true)
	})

	beforeEach(async function(){

	})

    describe.only('fetchOrderBook', async function() {
        it('可正常工作', async function() {
            util.log(JSON.stringify(await exchangeDelegate.fetchOrderBook(symbol)))
        })
    })

    describe.only('fetchAccount', async function() {
        it('可正常工作', async function() {              
            util.log(await exchangeDelegate.fetchAccount(symbol))
        })
    })

    describe.only('createLimitOrder', async function() {
        it('可正常工作', async function() {
            var account = await exchangeDelegate.fetchAccount(symbol)
            util.log(account)
            if(account.balance > 0.1) {
                util.log(await exchangeDelegate.createLimitOrder(symbol, "buy", 2.00001, 0.0001, account))
            }else {
                util.log(await exchangeDelegate.createLimitOrder(symbol, "sell", 0.1, 1, account))
            }
        })
    })

    describe.only('查找订单', async function() {
        it('返回挂单', async function() {
            util.log(await exchangeDelegate._fetchOpenOrders(symbol))
        })
    })

    describe('fetchTicker', async function() {
        it('可正常工作', async function() {
            util.log(await exchangeDelegate.fetchTicker(symbol))
        })
    })

    describe.only('异常处理', async function() {
        it('抛出异常，报错后重试成功', async function() {
            await exchangeDelegate.testErr()
            exchangeDelegate.isAvailable.should.equal(true)
            await exchangeDelegate.testErr()
            await util.sleep(3500)
            await exchangeDelegate.testErr()
            exchangeDelegate.isAvailable.should.equal(true)
            await exchangeDelegate.testErr()
            await exchangeDelegate.testErr()
            await exchangeDelegate.testErr()
            exchangeDelegate.isAvailable.should.equal(false)

            for(var i=0; i<10; i++) {
                await util.sleep(1000)
                if(i>6) {
                    exchangeDelegate.isAvailable.should.equal(true)
                }
            }
        })

        it('测试严重错误，重试成功', async function() {
            await exchangeDelegate.testErr(true)
            exchangeDelegate.isAvailable.should.equal(false)

            for(var i=0; i<10; i++) {
                await util.sleep(1000)
                if(i>6) {
                    exchangeDelegate.isAvailable.should.equal(true)
                }
            }
        })

        it('重复错误后关闭API', async function() {
            try{
                await exchangeDelegate.testErr(true)
                exchangeDelegate.isAvailable.should.equal(false)

                await util.sleep(8000)

                await exchangeDelegate.testErr(true)

                await util.sleep(8000)

                await exchangeDelegate.testErr(true)

                exchangeDelegate.isClosed.should.equal(true)

            }catch (e) {
                util.log(e)
            }
        })
    })
})