const util = require ('../../util/util.js')
const log = require ('ololog').configure ({ locate: false })
const ccxt = require ('ccxt')
const _ = require('lodash');
const Delay = 0

class ExchangeSim {
	constructor(info, crypto, fiat, initBalance, initStocks, realOrderBook=false, buySuccess=0.72, sellSuccess=0.72, debug=false){
		this.orderList = {}
		this.currID = 0
		this.tryTime = 0

        this.balance = initBalance
        this.stocks = initStocks
        this.frozenBalance = 0
        this.frozenStocks = 0

        this.id = info.id
        this.crypto = crypto
        this.fee = info.fee        
        this.fiat = fiat == 'USD'? info.fiat: fiat
        this.specialBuy = info.specialBuy
        this.minTrade = info.minTrade
        this.amountPrecision = info.precision

        this.realOrderBook = realOrderBook

        this.buySuccess = buySuccess
        this.sellSuccess = sellSuccess

        this.debug = debug

        this.ccxtExchange = new ccxt[info.id](info)
	}

    get isAvailable() {
        return true
    }

	async fetchOrderBook() {
		if(this.realOrderBook){
			return await this.ccxtExchange.fetchOrderBook(`${this.crypto}/${this.fiat}`)	        
		}else {
			throw "No order for sim"
		}	
	}

	async fetchBalance() {
		await util.sleep(Delay)
		var balance = {}
		balance[this.crypto] = {
			free: this.stocks,
			used: this.frozenStocks
		}
		balance[this.fiat] = {
			free: this.balance,
			used: this.frozenBalance			
		}
		this.log(`${this.id} balance: ${this.balance}, frozenBalance: ${this.frozenBalance}, stocks: ${this.stocks}, frozenStocks: ${this.frozenStocks}`, "green")
		return balance
	}

	async createLimitBuyOrder(symbol, amount, price) {
		this.currID++

		// price = util.toFixedNumber(price + this.getRandomArbitrary(-1, 0), 3)

		var sucess = this.getRandom(this.buySuccess)

		var status
		var stockDiff
		var balanceDiff

		if(sucess) {
			status = 'closed'
			stockDiff = this.specialBuy? amount: amount * (1-this.fee)
			balanceDiff = 0
			
		}else {
			status = 'open'
			stockDiff = 0
			balanceDiff = this.specialBuy? amount * price / (1-this.fee): amount * price
		}

		var order = {
			id: this.currID,
			amount: amount,
			price: price,
			status: status,
			type: "buy",
		}	

		this.orderList[this.currID] = order	

		this.balance -= this.specialBuy? amount * price / (1-this.fee): amount * price
		this.stocks += stockDiff
		this.frozenBalance += balanceDiff

		await util.sleep(Delay)
		return {id: order.id}		
	}

	async createLimitSellOrder(symbol, amount, price) {
		this.currID++

		// price = util.toFixedNumber(price + this.getRandomArbitrary(-1, 0), 3)

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

		await util.sleep(Delay)
		return {id: order.id}
	}

	async fetchOrder(orderID) {
		await util.sleep(Delay)
		return this.orderList[orderID]		
	}

	async fetchOpenOrders() {
		await util.sleep(Delay)
		return _.filter(this.orderList, function(o) { return o.status == 'open' })
	}

	async cancelOrder(orderID) {		
		this.tryTime++
		await util.sleep(Delay)

		if(this.tryTime >= 1) {				
			var order = this.orderList[orderID]
			if(order.type == 'buy') {			
				var balanceRollback = this.specialBuy? order.amount * order.price / (1-this.fee): order.amount * order.price
				this.frozenBalance -= balanceRollback
				this.balance += balanceRollback
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

	log(message, color='white') {
        if(this.debug) util.log[color](this.id, message)
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