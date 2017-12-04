const util = require ('../util/util.js')
const factory = require ('./API/exchangeFactory.js')
const _ = require('lodash')

const ORDER_STATE_PENDING = 'open'
const ORDER_TYPE_BUY = 'buy'
const ORDER_TYPE_SELL = 'sell'

const slippage = 0.0005
const defaultMinTrade = 0.0005
const defaultPrecision = 5
const defaultMinOrderSize = 0.0001


class Exchange {
	constructor(id, crypto, fiat, initBalance, initStocks, debug=true) {
        var info = util.getExchangeInfo(id)
		
        this.exchangeDelegate = factory.createExchange(info, crypto, fiat, initBalance, initStocks, debug)  

        this.id = info.id
        this.fee = info.fee        
        this.fiat = fiat == 'USD'? info.fiat: fiat
        this.specialBuy = info.specialBuy
        this.minTrade = this.getValue(info.minTrade, defaultMinTrade)
        this.precision = this.getValue(info.amountPrecision, defaultPrecision)
        this.minOrderSize = this.getValue(info.minOrderSize, defaultMinOrderSize)
        
        this.slippage = slippage
        this.crypto = crypto
        this.debug = debug

        this.balance = 0
        this.stocks = 0
        this.frozenBalance = 0
        this.frozenStocks = 0
        this.orderBooks = null
	}

	getValue(value, defaultValue) {
	    return value? value: defaultValue
    }

    get symbol() {
        return `${this.crypto}/${this.fiat}`
    }

    get account() {
        return {
            balance: this.balance,
            stocks: this.stocks,
            frozenBalance: this.frozenBalance,
            frozenStocks: this.frozenStocks,
        }
    }

    set account(account) {
        if(account) {
            this.balance = account.balance
            this.frozenBalance = account.frozenBalance
            this.stocks = account.stocks
            this.frozenStocks = account.frozenStocks
        }
    }

    get totalBalance() {
        return this.balance + this.frozenBalance
    }

    get totalStocks() {
        return this.stocks + this.frozenStocks
    }

    get buy1Price() {
        return this.getOrderBooksData('bids.0.0')    
    }

    get buy1Amount() {
        return this.getOrderBooksData('bids.0.1')
    }

    get sell1Price() {
        return this.getOrderBooksData('asks.0.0')
    }

    get sell1Amount() {
        return this.getOrderBooksData('asks.0.1')
    }

    get buyPrice() {
        return this.sell1Price * (1+this.slippage)
    }

    get sellPrice() {
        return this.buy1Price * (1-this.slippage)
    }

    get payForBuyOne() {  
        return this.buyPrice / (1-this.fee)
    }
    
    get earnForSellOne() {
        return this.sellPrice * (1-this.fee)
    }

    get amountCanBuy() {        
        return this.balance / this.payForBuyOne
    }

    get amountCanSell() {
        return this.stocks
    }

    get needMoreCoinForBuy() {
        return !this.specialBuy
    }

    canBuySuch(amount) {
        return this.payForBuyOne * amount >= this.minOrderSize && amount >= this.minTrade
    }

    canSellSuch(amount) {
        return this.earnForSellOne * amount >= this.minOrderSize && amount >= this.minTrade
    }

    limitBuy(amount) {  
        return this.placeLimitOrder(ORDER_TYPE_BUY, amount)
    }

    limitSell(amount) {  
        return this.placeLimitOrder(ORDER_TYPE_SELL, amount)
    }   

    async fetchOrderBook() {
        this.orderBooks = await this.exchangeDelegate.fetchOrderBook(this.symbol)
        return this.orderBooks
    }

    async fetchAccount() {
        this.account = await this.exchangeDelegate.fetchAccount(this.symbol)
        return {
            balance: this.totalBalance,
            stocks: this.totalStocks
        }
    }

    async placeLimitOrder(type, amount) {                
        if(![ORDER_TYPE_BUY, ORDER_TYPE_SELL].includes(type) || isNaN(amount)) {
            throw "Wrong order input"
        }

        if(!this.buy1Price || !this.sell1Price) {
            throw "orderBooks not available"
        }

        var orderPrice, orderAmount, result

        if(type == ORDER_TYPE_BUY) {
            orderPrice = _.ceil(this.buyPrice, 8)
            orderAmount = this.needMoreCoinForBuy? _.floor(amount/(1-this.fee), this.precision): _.floor(amount, this.precision)
            this.log(`限价买单，数量：${orderAmount}，价格：${orderPrice}`, 'green')
        }else {
            orderPrice = _.floor(this.sellPrice, 8)
            orderAmount = _.floor(amount, this.precision)
            this.log(`限价卖单，数量：${orderAmount}，价格：${orderPrice}`, 'blue')
        }

        result = await this.exchangeDelegate.createLimitOrder(this.symbol, type, orderAmount, orderPrice, this.account)
        this.account = result.newAccount
        return result.info
    }

    getOrderBooksData(path) {
        var value = util.deepGet(this.orderBooks, path)
        return value === undefined? 0: value
    }

    log(message, color='white') {
        if(this.debug) util.log[color](this.id, message)
    }

    async testOrder(buyPrice, sellPrice, amount) {
        amount = _.floor(amount, this.precision)
        var result = {}
        try{
            await this.fetchOrderBook()
            this.log(`buy1Price: ${this.buy1Price}`, 'yellow')
            this.log(`sell1Price: ${this.sell1Price}`, 'yellow')
            await this.fetchAccount()
            if(this.balance > 0) {
                this.log(`开始下买单, 数量: ${amount}, 金额: ${buyPrice}`, 'green')
                result = await this.exchangeDelegate.createLimitOrder(this.symbol, 'buy', amount, buyPrice, this.account)
                this.log(result)
            }else {
                this.log(`开始下卖单, 数量: ${amount}, 金额: ${sellPrice}`, 'blue')
                result = await this.exchangeDelegate.createLimitOrder(this.symbol, 'sell', amount, sellPrice, this.account)
                this.log(result)
            }
        }catch(e){
            this.log(e, 'red')
        }
    }
}
module.exports = Exchange