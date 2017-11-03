const util = require ('../util/util.js')
const factory = require ('./exchangeFactory.js')
const database = require('./database.js')
const _ = require('lodash')
const ccxt = require ('ccxt')
const exchangeInfo = require('../config/exchangeInfo.js')
const ExhangeSim = require ('./exchangeSim')

const ORDER_STATE_PENDING = 'open'
const ORDER_TYPE_BUY = 'buy'
const ORDER_TYPE_SELL = 'sell'

const slippage = 0.0005

class Exchange {
	constructor(id, crypto, fiat, initBalance, initStocks, debug=true) {
		this.exchangeDelegate = factory.createExchange(id, crypto, fiat, initBalance, initStocks)  

        this.id = this.exchangeDelegate.id
        this.delay = this.exchangeDelegate.delay
        this.fee = this.exchangeDelegate.fee        
        this.fiat = fiat == 'USD'? this.exchangeDelegate.fiat: fiat
        this.slippage = slippage
        this.crypto = crypto
        this.debug = debug

        this.balance = 0
        this.stocks = 0
        this.frozenBalance = 0
        this.frozenStocks = 0
        this.orderBooks = null
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

    get amountCanBuy() {
        return this.balance / (this.sell1Price * (1+this.slippage))
    }

    get amountCanSell() {
        return this.stocks
    }

    get payForBuy() {        
        return this.sell1Price * (1+this.slippage) / (1-this.fee)
    }

    get earnForSell() {
        return this.buy1Price * (1-this.slippage) * (1-this.fee)
    }

    async fetchOrderBook() {        
        var start = util.time
        this.orderBooks = await this.exchangeDelegate.fetchOrderBook(this.symbol, {
            'limit_bids': 5, // max = 50
            'limit_asks': 5, // may be 0 in which case the array is empty
            'group': 1, // 1 = orders are grouped by price, 0 = orders are separate
            'depth': 5,
            'size': 5,            
        })
        // this.log(`延迟： ${(util.time - start} ms`, 'yellow')  
        return this.orderBooks
    }

    async fetchAccount() {
        var account = await this.exchangeDelegate.fetchBalance()
        this.balance = account[this.fiat].free
        this.frozenBalance = account[this.fiat].used
        this.stocks = account[this.crypto].free 
        this.frozenStocks = account[this.crypto].used
        this.log(`balance: ${this.balance}, frozenBalance: ${this.frozenBalance}, stocks: ${this.stocks}, frozenStocks: ${this.frozenStocks}`, 'green')            
        return account
    }

    limitBuy(amount) {  
        return this.placeLimitOrder(ORDER_TYPE_BUY, amount)
    }

    limitSell(amount) {  
        return this.placeLimitOrder(ORDER_TYPE_SELL, amount)
    }   

    async placeLimitOrder(type, amount) {    
        var orderID
        var orderOpt
        
        if(![ORDER_TYPE_BUY, ORDER_TYPE_SELL].includes(type) || isNaN(amount)) {
            throw "Wrong order input"
        }

        if(!this.buy1Price || !this.sell1Price) {
            throw "orderBooks not available"
        }

        if(type == ORDER_TYPE_BUY) {
            var orderPrice = util.toFixedNumber(this.sell1Price * (1 + this.slippage), 8)
            // var orderPrice = util.toFixedNumber(this.sell1Price * (1 + this.slippage), 1)
            orderOpt = this.exchangeDelegate.createLimitBuyOrder(this.symbol, amount, orderPrice)
            this.log(`限价买单，数量：${amount}，价格：${orderPrice}`, 'green')
        }else {
            var orderPrice = util.toFixedNumber(this.buy1Price * (1 - this.slippage), 8)
            // var orderPrice = util.toFixedNumber(this.buy1Price * (1 - this.slippage), 1)
            orderOpt = this.exchangeDelegate.createLimitSellOrder(this.symbol, amount, orderPrice)
            this.log(`限价卖单，数量：${amount}，价格：${orderPrice}`, 'blue')
        }      

        var result = {}        
        try{
            result = await orderOpt          
        }catch(e){
            this.log(e, 'red')
            await util.sleep(4 * this.delay)
        }        

        await this.cancelPendingOrders(result.id)     
    }

    async cancelPendingOrders(orderID) {
        this.log("开始轮询订单状态")
        var retryTime = 0
        while(retryTime < 10) {
            try{
                this.log("--------------------------------")
                await util.sleep(this.delay)

                await this.fetchAccount()
                // if(orderID) {
                //     var order = await this.exchangeDelegate.fetchOrder(orderID, this.symbol)
                //     if(order && order.status == 'open') {
                //         await this.cancelOrder(order)                        
                //         continue
                //     }
                // }

                var orders = await this.exchangeDelegate.fetchOpenOrders(this.symbol)
                if(orders && orders.length > 0) {
                    for(var order of orders) {
                        await this.cancelOrder(order)                        
                        util.sleep(this.delay)
                    } 
                    continue
                }
                                
                if(this.frozenStocks == 0 && this.frozenBalance == 0) {
                    break
                }                    
            }catch(e){          
                this.log(e.message, 'red')    
                retryTime++                
            }        
        }
        this.log("订单轮询处理结束")
    }

    async cancelOrder(order) {
        await this.exchangeDelegate.cancelOrder(order.id, this.symbol) 
        this.log(`订单 ${order.id} 取消完成`, 'yellow')
    }

    getOrderBooksData(path) {
        var value = util.deepGet(this.orderBooks, path)
        return value === undefined? 0: value
    }

    log(message, color='white') {
        if(this.debug) util.log[color](this.id, message)
    }

    async testOrder(buyPrice, sellPrice, amount) {
        var result = {}
        try{
            await this.fetchOrderBook()
            this.log(`buy1Price: ${this.buy1Price}`, 'yellow')
            this.log(`sell1Price: ${this.sell1Price}`, 'yellow')
            await this.fetchAccount()            
            this.log("开始下买单", 'green')
            result = await this.exchangeDelegate.createLimitBuyOrder(this.symbol, amount, buyPrice)            
            this.log(`取消订单 ${result.id}`, 'yellow')
            await this.cancelPendingOrders(result.id)               
            this.log("开始下卖单", 'blue')
            result = await this.exchangeDelegate.createLimitSellOrder(this.symbol, amount, sellPrice)        
            this.log(`取消订单 ${result.id}`, 'yellow')
            await this.cancelPendingOrders(result.id)
        }catch(e){
            this.log(e, 'red')         
        }    
    }
}
module.exports = Exchange