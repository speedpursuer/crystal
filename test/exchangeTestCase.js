const should = require('should');
const Exchange = require('../service/exchange.js')
const util = require('../util/util.js')


async function test() {

	var list = ['Bitfinex', 'Poloniex', 'Bittrex']  
	var result = []

	for(var id of list) {		
		var exchange = new Exchange(id, "BTC", true)
		result.push(exchange.testOrder1())
	}
	
	await Promise.all(result)

	// var exchange = new Exchange('Kraken', "BTC", true)
	// await exchange.testOrder1()

	process.exit()      

	// await exchange.getAccount()
 //    await exchange.fetchOrderBook()    		
	// await exchange.limitBuy(0.002)
}

test()

// describe.only('exchange class', async function() {

// 	var exchange = new Exchange('kraken', "BTC", true)

// 	afterEach(async function(){
		
// 	})

//   	describe('测试交易', async function() {  		
//     	it('限价买单', async function() {
//     		await exchange.getAccount()
//     		await exchange.fetchOrderBook()    		
//       		await exchange.limitBuy(0.001)
//     	});
//   	});
// });