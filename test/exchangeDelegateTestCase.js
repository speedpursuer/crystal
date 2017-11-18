const should = require('should');
const util = require('../util/util.js')
const ExchangeDelegate = require('../service/API/exchangeDelegate')


describe.only('单元测试ExchangeDelegate', async function() {	

	this.timeout(50000)

    var exchangeDelegate
    var symbol = "BCH/BTC"

	before(async function() {
    	var info = util.getExchangeInfo('kraken')
        exchangeDelegate = new ExchangeDelegate(info)            
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
                balance: 0.000007,
                frozenBalance: 0,
                stocks: 0,
                frozenStocks: 0         
            }        
            util.log(await exchangeDelegate.createLimitOrder(symbol, "buy", 0.000001, 0.000001, balance))
        })
    })

    // describe('fetchAccount', async function() {          
    //     it('可正常工作', async function() {  
            
    //         exchangeDelegate.
    //     })
    // })
})