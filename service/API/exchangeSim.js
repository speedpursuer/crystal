const util = require ('../../util/util.js')
const log = require ('ololog').configure ({ locate: false })
const ccxt = require ('ccxt')
const _ = require('lodash');
const Delay = 0

// const allSymbols = {
// 	BTC: 'BTC',
// 	ETH: 'ETH',
// 	BCH: 'BCH',
// 	BCC: 'BCH',
// 	EOS: 'EOS',
// 	IOTA: 'IOTA'
// }

class ExchangeSim {
	constructor(info, balance, buySuccess=0.72, sellSuccess=0.72, realOrderBook=false, debug=false){
		this.orderList = {}
		this.currID = 0
		this.tryTime = 0

        this.balanceMgr = new BalanceMgr(balance)

        this.id = info.id
        this.fee = info.fee
        this.specialBuy = info.specialBuy

        this.realOrderBook = realOrderBook

        this.buySuccess = buySuccess
        this.sellSuccess = sellSuccess

        this.debug = debug

        this.ccxtExchange = new ccxt[info.id](info)
	}

    get isAvailable() {
        return true
    }

    addBalance(balance) {
		this.balanceMgr.addBalance(balance)
	}

    getBalance(symbol) {
		return this.balanceMgr.getExchangePair(symbol)
	}

	async fetchOrderBook(symbol) {
		if(this.realOrderBook){
			return await this.ccxtExchange.fetchOrderBook(symbol)
		}else {
			throw new Error("No order for sim")
		}	
	}

	async fetchBalance() {
        await util.sleep(Delay)
		let balance = this.balanceMgr.fetchAllBalance()
		this.log(balance, 'yellow')
		return balance
	}

	async createLimitBuyOrder(symbol, amount, price) {
		this.currID++

		// price = util.toFixedNumber(price + this.getRandomArbitrary(-1, 0), 3)

		var sucess = this.getRandom(this.buySuccess)

		var status
		var stockDiff
		var balanceDiff

		let account = this.getBalance(symbol)

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

        account.balance -= this.specialBuy? amount * price / (1-this.fee): amount * price
        account.stocks += stockDiff
        account.frozenBalance += balanceDiff

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

        let account = this.getBalance(symbol)

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

        account.stocks -= amount
        account.balance += balanceDiff
        account.frozenStocks += stockDiff

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

	async cancelOrder(orderID, symbol) {
		this.tryTime++
		await util.sleep(Delay)

		if(this.tryTime >= 1) {				
			var order = this.orderList[orderID]
			if(order.status == 'closed') return true
            let account = this.getBalance(symbol)
			if(order.type == 'buy') {			
				var balanceRollback = this.specialBuy? order.amount * order.price / (1-this.fee): order.amount * order.price
                account.frozenBalance -= balanceRollback
                account.balance += balanceRollback
			}else {
                account.frozenStocks -= order.amount
                account.stocks += order.amount
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

class BalanceMgr {
	constructor(initBalance) {
        this.balanceList = {}
        this.addBalance(initBalance)
	}

	getExchangePair(symbol) {
        let pair = _.split(symbol, '/')
		if(pair.length !== 2) throw new Error(`symbol - ${symbol} is not valid`)
		return new ExchangePair(this.balanceList[pair[0]], this.balanceList[pair[1]])
	}

	fetchAllBalance() {
		return this.balanceList
	}

	addBalance(initBalance) {
        for(let symbol in initBalance) {
            this.balanceList[symbol] = new Balance(initBalance[symbol], 0)
        }
	}
}

class ExchangePair {
	constructor(base, quote) {
		this.base = base
		this.quote = quote
	}
	set balance(amount) {
		this.quote.free = amount
	}
    get balance() {
        return this.quote.free
    }
	set frozenBalance(amount) {
		this.quote.used = amount
	}
    get frozenBalance() {
        return this.quote.used
    }
	set stocks(amount) {
		this.base.free = amount
	}
    get stocks() {
        return this.base.free
    }
	set frozenStocks(amount){
		this.base.used = amount
	}
    get frozenStocks(){
        return this.base.used
    }
}

class Balance {
	constructor(free, used) {
		this.free = free
		this.used = used
	}
}

module.exports = ExchangeSim