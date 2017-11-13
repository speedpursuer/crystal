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
        
        this.realOrderBook = realOrderBook

        this.buySuccess = buySuccess
        this.sellSuccess = sellSuccess

        this.debug = debug

        this.ccxtExchange = new ccxt[info.id](info)
	}

	async fetchOrderBook() {
		if(this.realOrderBook){
			return await this.ccxtExchange.fetchOrderBook(`${this.crypto}/${this.fiat}`)	        
		}else {
			await util.sleep(Delay)
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

	async fetchAccount() {
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

	async createLimitOrder(symbol, type, amount, price, balanceInfo) {
		if(type == "buy") {
			await this.createLimitBuyOrder(symbol, amount, price)
		}else {
			await this.createLimitSellOrder(symbol, amount, price)
		}

		return await this.cancelPendingOrders(symbol, balanceInfo)
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

	async cancelPendingOrders(symbol, balanceInfo) {
		this.log("开始轮询订单状态")
                
        var beforeAccount = balanceInfo
        var retryTimes = 0        
        var dealAmount = 0
        var balanceChanged = 0
        var hasPendingOrders = false
        var completed = false            

        while(retryTimes < 10) {   
            retryTimes++
            var orders = await this.fetchOpenOrders(symbol)
            if(orders && orders.length > 0) {
                hasPendingOrders = true
                for(var order of orders) {
                    await this.cancelOrder(order.id, symbol)                        
                    await util.sleep(Interval)
                }
                continue
            }

            var newAccount = await this.fetchAccount()

            // 没有挂单，但余额没变，需要重新刷新
            if(!hasPendingOrders && beforeAccount.balance == newAccount.balance && beforeAccount.stocks == newAccount.stocks) {                
                continue
            }        

            if(newAccount.frozenStocks == 0 && newAccount.frozenBalance == 0) {
                dealAmount = Math.abs(newAccount.stocks - beforeAccount.stocks)
                balanceChanged = newAccount.balance - beforeAccount.balance
                completed = true
                break
            }         
        }
        if(completed) {
        	this._status = true
        	this._log("订单轮询处理完成", "green")
        }else {
        	this._status = false
        	this._log("订单轮询处理失败", "red")
        }        

        return {amount, dealAmount, balanceChanged, completed}
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