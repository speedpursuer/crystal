const Exchange = require('../service/exchange.js')
const log = require ('ololog').configure ({ locate: false })
const ExchangeSim = require ('../service/exchangeSim.js')



async function testSim() {
	try{
		var info = {      
        	fee: 0.0016,
        	fiat: 'USD'
    	}
		var exchangeSim = new ExchangeSim('kraken', info, false, 1, 1)
		var result = await exchangeSim.createLimitBuyOrder('BTC', 12, 3000)
		log(result.id)
		var order = await exchangeSim.fetchOrder(result.id)
		log(order)
		// log(exchangeSim.orderList)
		var orders = await exchangeSim.fetchOpenOrders()
		log(orders)
		// var i = 0
		// var status = false
		// while(i < 8 && status == false){
		// 	var status = await exhangeSim.cancelOrder(result.id)
		// 	log(status)	
		// 	i++
		// }		
	}catch(e){
		log(e)
	}	
}


testSim()

