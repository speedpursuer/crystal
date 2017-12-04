const should = require('should');
const util = require('../util/util.js')
const ExchangeDelegate = require('../service/API/exchangeDelegate')
const factory = require ('../service/API/exchangeFactory.js')


describe('单元测试ExchangeDelegate', async function() {

	this.timeout(50000)

    var exchangeDelegate
    var symbol = "BTC/USD"
    // var symbol = "BCH/BTC"
    var balance = {}

	before(async function() {
        global.realMode = true
    	var info = util.getExchangeInfo('quoine')
        balance = {
            balance: 10,
            frozenBalance: 0,
            stocks: 100,
            frozenStocks: 0
        }
        exchangeDelegate = factory.createExchange(info, "BTC", "USD", balance.balance, balance.stocks, true)
        // exchangeDelegate = factory.createExchange(info, "BCH", "BTC", balance.balance, balance.stocks, true)
	})

	beforeEach(async function(){

	})

  	describe.only('fetchOrderBook', async function() {
    	it('可正常工作', async function() {              
            util.log(await exchangeDelegate.fetchOrderBook(symbol))
    	})
  	})

    describe.only('fetchAccount', async function() {
        it('可正常工作', async function() {              
            util.log(await exchangeDelegate.fetchAccount(symbol))
        })
    })

    describe('createLimitOrder', async function() {
        it('可正常工作', async function() {      

            util.log(await exchangeDelegate.createLimitOrder(symbol, "buy", 0.1, 0.000001, balance))
        })
    })

    describe.only('查找订单', async function() {
        it('返回挂单', async function() {
            util.log(await exchangeDelegate._fetchOpenOrders(symbol))
        })
    })

    describe('异常处理', async function() {
        it('模拟_fetchOpenOrders抛出异常，报错后重试成功', async function() {
            await exchangeDelegate._fetchOpenOrders(symbol)
            exchangeDelegate.isAvailable.should.equal(true)
            await exchangeDelegate._fetchOpenOrders(symbol)
            await util.sleep(3500)
            await exchangeDelegate._fetchOpenOrders(symbol)
            exchangeDelegate.isAvailable.should.equal(true)
            await exchangeDelegate._fetchOpenOrders(symbol)
            await exchangeDelegate._fetchOpenOrders(symbol)
            await exchangeDelegate._fetchOpenOrders(symbol)
            exchangeDelegate.isAvailable.should.equal(false)

            for(var i=0; i<10; i++) {
                await util.sleep(1000)
                if(i>6) {
                    exchangeDelegate.isAvailable.should.equal(true)
                }
            }
        })

        it('模拟下单不成功，取消时抛出异常，测试严重错误，重试成功', async function() {
            await exchangeDelegate.createLimitOrder(symbol, "buy", 0.1, 0.000001, balance)
            exchangeDelegate.isAvailable.should.equal(false)

            for(var i=0; i<10; i++) {
                await util.sleep(1000)
                if(i>6) {
                    exchangeDelegate.isAvailable.should.equal(true)
                }
            }
        })
    })
})