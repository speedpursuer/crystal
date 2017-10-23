const should = require('should');
const Exchange = require('../service/exchange.js')
const util = require('../util/util.js')


async function test() {

	var list = ['Bitfinex', 'Poloniex', 'Bittrex']  
	var result = []

	for(var id of list) {		
		var exchange = new Exchange(id, "BTC", true)
		result.push(exchange.testOrder())
	}
	
	await Promise.all(result)

	
}

async function test1() {
	var exchange = new Exchange('Kraken', "BTC", true)
	await exchange.
	process.exit()      
}

async function testOrder() {
	try{
		var exchange = new Exchange('bitstamp', 'BTC', true)
		await exchange.fetchOrderBook()
		var order = await exchange.limitBuy(0.01)
		// var order = await exchange.limitSell(0.01)
		log("order", order)
		// var account = await exchange.limitBuy(0.01)
	}catch(e) {
		log(e)
	}
}

async function testAccount() {
	try{
		var exchange = new Exchange('bittrex', 'BTC', true)
		await exchange.fetchAccount()
		// log(await exchange.fetchOrderBook('BTC/USD'))	
	}catch(e) {
		log(e)
	}	
}

test()