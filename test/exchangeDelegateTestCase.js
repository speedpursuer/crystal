const should = require('should');
const util = require('../util/util.js')
const ExchangeDelegate = require('../service/API/exchangeDelegate')
const factory = require ('../service/API/exchangeFactory.js')


describe.only('单元测试ExchangeDelegate', async function() {	

	this.timeout(50000)

    var exchangeDelegate
    var symbol = "BCH/BTC"

	before(async function() {
        global.realMode = true
    	var info = util.getExchangeInfo('bitfinex')
        exchangeDelegate = factory.createExchange(info, "BCH", "BTC", 0, 0, true)
	})

	afterEach(async function(){
		
	})

  	describe('fetchOrderBook', async function() {
    	it('可正常工作', async function() {              
            util.log(await exchangeDelegate.fetchOrderBook(symbol))
    	})
  	})

    describe('fetchAccount', async function() {
        it('可正常工作', async function() {              
            util.log(await exchangeDelegate.fetchAccount(symbol))
        })
    })

    describe.only('createLimitOrder', async function() {
        it('可正常工作', async function() {      
            var balance = {       
                balance: 0.17573266,
                frozenBalance: 0,
                stocks: 7.50280876,
                frozenStocks: 0         
            }        
            util.log(await exchangeDelegate.createLimitOrder(symbol, "buy", 0.1, 0.000001, balance))
        })
    })

    // describe('fetchAccount', async function() {          
    //     it('可正常工作', async function() {  
            
    //         exchangeDelegate.
    //     })
    // })
})