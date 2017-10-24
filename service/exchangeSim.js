const util = require ('../util/util.js')
const log = require ('ololog').configure ({ locate: false })
const ccxt = require ('ccxt')
const _ = require('lodash');

class ExchangeSim {
	constructor(id, info, realOrderBook=false, buySuccess=0.72, sellSuccess=0.72){
		this.orderList = {}
		this.currID = 0
		this.tryTime = 0
		//JPY
		// this.balance = 85000
  //       this.stocks = 0.134
        //USD
        this.balance = 1500
        this.stocks = 0.26
        this.frozenBalance = 0
        this.frozenStocks = 0

        this.id = id
        this.fiat = info.fiat
        this.fee = info.fee
        this.crypto = 'BTC'

        this.realOrderBook = realOrderBook

        this.buySuccess = buySuccess
        this.sellSuccess = sellSuccess

        this.ccxtExchange = new ccxt[id](info)
	}

	async fetchOrderBook() {
		if(this.realOrderBook){
			return await this.ccxtExchange.fetchOrderBook(`${this.crypto}/${this.fiat}`)	        
		}else {
			await util.sleep(300)
			var book = this.id == 'bitfinex'? 
			{
				asks: [
					[5000, 0.1],
					[5003, 0.2]
				],
				bids: [
					[5055, 0.5],
					[5004, 0.3],
				]
			}:
			{
				asks: [
					[5000, 0.1],
					[5003, 0.2]
				],
				bids: [
					[5005, 0.5],
					[5004, 0.3],
				]
			}
			return book
		}	
	}

	async fetchBalance() {
		await util.sleep(300)
		var balance = {}
		balance[this.crypto] = {
			free: this.stocks,
			used: this.frozenStocks
		}
		balance[this.fiat] = {
			free: this.balance,
			used: this.frozenBalance			
		}
		return balance
	}

	async createLimitBuyOrder(symbol, amount, price) {
		this.currID++

		price = util.toFixedNumber(price + this.getRandomArbitrary(-1, 0), 3)

		var sucess = this.getRandom(this.buySuccess)

		var status
		var stockDiff
		var balanceDiff

		if(sucess) {
			status = 'closed'
			stockDiff = amount
			balanceDiff = 0
			
		}else {
			status = 'open'
			stockDiff = 0
			balanceDiff = amount * price / (1-this.fee)
		}

		var order = {
			id: this.currID,
			amount: amount,
			price: price,
			status: status,
			type: "buy",
			amount: amount
		}	

		this.orderList[this.currID] = order	

		this.balance -= amount * price / (1-this.fee)
		this.stocks += stockDiff
		this.frozenBalance += balanceDiff

		await util.sleep(300)
		return {id: order.id}		
	}

	async createLimitSellOrder(symbol, amount, price) {
		this.currID++

		price = util.toFixedNumber(price + this.getRandomArbitrary(-1, 0), 3)

		var sucess = this.getRandom(this.sellSuccess)

		var status
		var stockDiff
		var balanceDiff

		if(sucess) {
			status = 'closed'
			balanceDiff = amount * price * (1-this.fee)
			stockDiff = 0
		}else {
			status = 'open'
			balanceDiff = 0
			stockDiff = amount
		}

		var order = {
			id: this.currID,
			amount: amount,
			price: price,
			status: status,
			type: "sell",
			amount: amount
		}

		this.orderList[this.currID] = order

		this.stocks -= amount
		this.balance += balanceDiff
		this.frozenStocks += stockDiff

		await util.sleep(300)
		return {id: order.id}
	}

	async fetchOrder(orderID) {
		await util.sleep(300)
		return this.orderList[orderID]		
	}

	async fetchOpenOrders() {
		await util.sleep(300)
		return _.filter(this.orderList, function(o) { return o.status == 'open' })
	}

	async cancelOrder(orderID) {		
		this.tryTime++
		await util.sleep(300)

		if(this.tryTime >= 1) {				
			var order = this.orderList[orderID]
			if(order.type == 'buy') {					
				this.frozenBalance -= order.amount * order.price / (1-this.fee)
				this.balance += order.amount * order.price / (1-this.fee)
			}else {
				this.frozenStocks -= order.amount
				this.stocks += order.amount
			}
			order.status = 'closed'
			this.tryTime = 0
			return true
		}else{
			return false
		}
	}

	getRandomArbitrary (min, max) {
        return Math.random() * (max - min) + min;
    }

    getRandom (probability){
        var probability = probability*100 || 1;
        var odds = Math.floor(Math.random()*100);
      
        if(probability === 1){return 1};
        if(odds < probability){
            return true;
        }else{
            return false;
        }
    }
}
module.exports = ExchangeSim