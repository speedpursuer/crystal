const EventEmitter = require('events')
const util = require ('../../util/util.js')
const _ = require('lodash')

const ORDER_TYPE_BUY = 'buy'
const ORDER_TYPE_SELL = 'sell'

const defaultSlippage = 0.0005
const defaultMinTrade = 0.0005
const defaultPrecision = 5
const defaultMinOrderSize = 0.0001
const defaultOrderRate = 0.2


class Exchange extends EventEmitter {
	constructor(exchangeDelegate, info, crypto, fiat, debug=true) {
        super()

        this.exchangeDelegate = exchangeDelegate

        this.id = info.id
        this.fee = info.fee        
        this.fiat = fiat === 'USD'? info.fiat: fiat
        this.specialBuy = this.getValue(info.specialBuy, false)
        this.minTrade = this.getValue(info.minTrade, defaultMinTrade)
        this.precision = this.getValue(info.precision, defaultPrecision)
        this.minOrderSize = this.getValue(info.minOrderSize, defaultMinOrderSize)
        this.slippage = this.getValue(info.slippage, defaultSlippage)
        this.orderRate = this.getValue(info.orderRate, defaultOrderRate)

        this.crypto = crypto
        this.debug = debug

        this.balance = 0
        this.stocks = 0
        this.frozenBalance = 0
        this.frozenStocks = 0
        this.orderBooks = null

        this.dataUpdate()

        this.log(`交易配置 - base: ${this.crypto}, quote: ${this.fiat}, fee: ${this.fee}, specialBuy: ${this.specialBuy}, minTrade: ${this.minTrade}, precision: ${this.precision}, minOrderSize: ${this.minOrderSize}, slippage: ${this.slippage}, orderRate: ${this.orderRate}`, 'green')
	}

	dataUpdate() {
	    let that = this
        this.exchangeDelegate.on('balanceUpdate', function(data){
            that.account = this.parseAccount(data, that.symbol)
        })

        this.exchangeDelegate.on('lastOrderResult', function(orderResult){
            that.emit('lastOrderResult', orderResult)
        })
    }

	getValue(value, defaultValue) {
	    return value!==undefined? value: defaultValue
    }

    get isAvailable() {
	    return this.exchangeDelegate.isAvailable
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

    get sell1Price() {
        return this.getOrderBooksData('asks.0.0')
    }

    get buy1Amount() {
        if(this.getOrderBooksData('bids.0.1') == 0) return 0
        let minBuyPrice = this.getOrderBooksData('bids.0.0') * 0.99999
        return _.reduce(this.getOrderBooksData('bids'), function(total, value) {
            if(value[0] && value[0] >= minBuyPrice) {
                total += value[1]
            }
            return total
        }, 0) * this.orderRate
    }

    get sell1Amount() {
        if(this.getOrderBooksData('asks.0.1') == 0) return 0
        let maxSellPrice = this.getOrderBooksData('asks.0.0') * 1.00001
        return _.reduce(this.getOrderBooksData('asks'), function(total, value) {
            if(value[0] && value[0] <= maxSellPrice) {
                total += value[1]
            }
            return total
        }, 0) * this.orderRate
    }

    get price() {
	    return (this.buyPrice + this.sellPrice) / 2
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
        return this.adjustedOrderAmount(this.balance / this.payForBuyOne)
    }

    get amountCanSell() {
        return this.adjustedOrderAmount(this.stocks)
    }

    get needMoreCoinForBuy() {
        return !this.specialBuy
    }

    canBuySuch(amount) {
        return this.adjustedOrderPrice(this.buyPrice) * this.adjustedBuyAmount(amount) >= this.minOrderSize && this.adjustedOrderAmount(amount) >= this.minTrade
        // return this.payForBuyOne * this.adjustedOrderAmount(amount) >= this.minOrderSize && this.adjustedOrderAmount(amount) >= this.minTrade
    }

    canSellSuch(amount) {
        return this.adjustedOrderPrice(this.sellPrice) * this.adjustedOrderAmount(amount) >= this.minOrderSize && this.adjustedOrderAmount(amount) >= this.minTrade
        // return this.earnForSellOne * this.adjustedOrderAmount(amount) >= this.minOrderSize && this.adjustedOrderAmount(amount) >= this.minTrade
    }

    limitBuy(amount) {  
        return this.placeLimitOrder(ORDER_TYPE_BUY, amount)
    }

    limitSell(amount) {  
        return this.placeLimitOrder(ORDER_TYPE_SELL, amount)
    }

    adjustedOrderAmount(amount) {
        return _.floor(amount, this.precision)
    }

    adjustedBuyAmount(amount) {
        return this.adjustedOrderAmount(this.needMoreCoinForBuy? amount/(1-this.fee): amount)
    }

    adjustedOrderPrice(price) {
	    return _.floor(price, 7)
    }

    async fetchOrderBook() {
        this.orderBooks = await this.exchangeDelegate.fetchOrderBook(this.symbol)
        // this.checkOrderbook()
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
            throw new Error("Wrong order input")
        }

        if(!this.buy1Price || !this.sell1Price) {
            throw new Error("orderBooks not available")
        }

        var orderPrice, orderAmount, result

        if(type === ORDER_TYPE_BUY) {
            orderPrice = this.adjustedOrderPrice(this.buyPrice)
            orderAmount = this.adjustedBuyAmount(amount)
            this.log(`限价买单，数量：${orderAmount}，价格：${orderPrice}`, 'green')
        }else {
            orderPrice = this.adjustedOrderPrice(this.sellPrice)
            orderAmount = this.adjustedOrderAmount(amount)
            this.log(`限价卖单，数量：${orderAmount}，价格：${orderPrice}`, 'blue')
        }

        return await this.exchangeDelegate.createLimitOrder(this.symbol, type, orderAmount, orderPrice, this.account)
    }

    getOrderBooksData(path) {
        var value = util.deepGet(this.orderBooks, path)
        return value === undefined? 0: value
    }

    checkOrderbook() {
	    this.checkOrderbookBySide('bids')
        this.checkOrderbookBySide('asks')
    }

    checkOrderbookBySide(side) {
        if(this.getOrderBooksData(side).length === 0) {
            this.log(`No ${side} found for ${this.symbol}`)
        }
    }

    log(message, color='white') {
        if(this.debug) util.log[color](this.id, message)
    }

    async testOrder(buyPrice, sellPrice, amount) {
        amount = _.floor(amount, this.precision)
        var result = {}
        try{
            // await this.fetchOrderBook()
            // this.log(`buy1Price: ${this.buy1Price}`, 'yellow')
            // this.log(`sell1Price: ${this.sell1Price}`, 'yellow')
            // await this.fetchAccount()
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