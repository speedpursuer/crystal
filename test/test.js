const Exchange = require('../service/exchange.js')
const log = require ('ololog').configure ({ locate: false })
const ExhangeSim = require ('../service/exchangeSim.js')

async function testAccount() {
	try{
		var exchange = new Exchange('bittrex', 'BTC', true)
		await exchange.getAccount()
		// log(await exchange.fetchOrderBook('BTC/USD'))	
	}catch(e) {
		log(e)
	}	
}

async function testSim() {
	try{
		var exhangeSim = new ExhangeSim()
		var result = await exhangeSim.createLimitBuyOrder('BTC', 12, 3000)
		log(result.id)
		var order = await exhangeSim.fetchOrder(result.id)
		log(order)
		var i = 0
		var status = false
		while(i < 8 && status == false){
			var status = await exhangeSim.cancelOrder(result.id)
			log(status)	
			i++
		}		
	}catch(e){
		log(e)
	}	
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

// testOrder()

