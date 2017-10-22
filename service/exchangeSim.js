const util = require ('../util/util.js')
const log = require ('ololog').configure ({ locate: false })
const ccxt = require ('ccxt')

class ExchangeSim {
	constructor(id, info, realOrderBook=false, buySuccess=0.72, sellSuccess=0.72){
		this.orderList = []
		this.currID = 0
		this.tryTime = 0
		//JPY
		// this.balance = 85000
  //       this.stocks = 0.134
        //USD
        this.balance = 460
        this.stocks = 0.08
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

	fetchOrderBook() {

		if(this.realOrderBook){
			return this.ccxtExchange.fetchOrderBook(`${this.crypto}/${this.fiat}`)
	        .then(function(orderBooks){
	            return orderBooks
	        })
	        .catch(function(e){
	            throw e
	        })
		}else {
			var self = this
			return util.sleep(300)
			.then(function(){
				var book = self.id == 'bitfinex'? 
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
			})
			.catch(function(e){
		        throw e
		    })
		}	
	}

	fetchBalance() {
		var self = this
		return util.sleep(300)
		.then(function(){
			var balance = {}
			balance[self.crypto] = {
				free: self.stocks,
				used: self.frozenStocks
			}
			balance[self.fiat] = {
				free: self.balance,
				used: self.frozenBalance			
			}
			return balance
		})
		.catch(function(e){
            throw e
        })
	}

	createLimitBuyOrder(symbol, amount, price) {
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
			status = 'live'
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

		return util.sleep(300)
		.then(function(){
			return {id: order.id}
		})
		.catch(function(e){
            throw e
        })
	}

	createLimitSellOrder(symbol, amount, price) {
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
			status = 'live'
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

		return util.sleep(300)
		.then(function(){
			return {id: order.id}
		})
		.catch(function(e){
            throw e
        })
	}

	fetchOrder(orderID) {
		var self = this
		return util.sleep(300)
		.then(function(){
			return self.orderList[orderID]	
		})
		.catch(function(e){
            throw e
        })		
	}

	cancelOrder(orderID) {
		var self = this
		this.tryTime++
		return util.sleep(300)
		.then(function(){
			// log("self.tryTime: ", self.tryTime)
			if(self.tryTime >= 1) {				
				var order = self.orderList[orderID]
				if(order.type == 'buy') {					
					self.frozenBalance -= order.amount * order.price / (1-self.fee)
					self.balance += order.amount * order.price / (1-self.fee)
				}else {
					self.frozenStocks -= order.amount
					self.stocks += order.amount
				}
				order.status = 'closed'
				self.tryTime = 0
				return true
			}else{
				return false
			}			
		})
		.catch(function(e){
            throw e
        })
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