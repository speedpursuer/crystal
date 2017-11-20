const util = require ('../util/util.js')
const factory = require ('./API/exchangeFactory.js')
const _ = require('lodash')

const ORDER_STATE_PENDING = 'open'
const ORDER_TYPE_BUY = 'buy'
const ORDER_TYPE_SELL = 'sell'

const slippage = 0.0005
const defaultMinTrade = 0.005
const defaultPrecision = 5


class Exchange {
	constructor(id, crypto, fiat, initBalance, initStocks, debug=true) {
        var info = util.getExchangeInfo(id)
		
        this.exchangeDelegate = factory.createExchange(info, crypto, fiat, initBalance, initStocks, debug)  

        this.id = info.id
        this.fee = info.fee        
        this.fiat = fiat == 'USD'? info.fiat: fiat,
        this.specialBuy = info.specialBuy
        this.minTrade = info.minTrade? info.minTrade: defaultMinTrade
        this.precision = info.amountPrecision? info.amountPrecision: defaultPrecision
        
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

        var orderPrice, orderAmount

        if(type == ORDER_TYPE_BUY) {
            orderPrice = _.ceil(this.buyPrice, 8)
            orderAmount = this.needMoreCoinForBuy? _.floor(amount/(1-this.fee), this.precision): _.floor(amount, this.precision)
            this.log(`限价买单，数量：${orderAmount}，价格：${orderPrice}`, 'green')
        }else {
            orderPrice = _.floor(this.sellPrice, 8)
            orderAmount = _.floor(amount, this.precision)
            this.log(`限价卖单，数量：${orderAmount}，价格：${orderPrice}`, 'blue')
        }

        var result = await this.exchangeDelegate.createLimitOrder(this.symbol, type, orderAmount, orderPrice, this.account)
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

    // async fetchOrderBook() {        
    //     // var start = util.time
    //     try{          
    //         this.orderBooks = await util.promiseWithTimeout(                
    //             () => this.exchangeDelegate.fetchOrderBook(this.symbol, {
    //                 'limit_bids': 5, // max = 50
    //                 'limit_asks': 5, // may be 0 in which case the array is empty
    //                 'group': 1, // 1 = orders are grouped by price, 0 = orders are separate
    //                 'depth': 5,
    //                 'size': 5,            
    //             }),
    //             10000
    //         )

    //     }catch(e){
    //         util.log(`${this.id} 获取orderbook失败 ${e}`)
    //         this.orderBooks = null
    //     }
    //     // this.log(`延迟： ${(util.time - start} ms`, 'yellow')  
    //     return this.orderBooks
    // }

    // async fetchAccount() {
    //     try {
    //         var account = await this.exchangeDelegate.fetchBalance()                        
    //         this.balance = account[this.fiat]? account[this.fiat].free: 0
    //         this.frozenBalance = account[this.fiat]? account[this.fiat].used: 0
    //         this.stocks = account[this.crypto]? account[this.crypto].free: 0
    //         this.frozenStocks = account[this.crypto]? account[this.crypto].used: 0
    //         this.logAccount()
    //     }catch(e) {
    //         this.log(e, 'red')
    //     }
        
    //     return {
    //         balance: this.balance + this.frozenBalance,
    //         stocks: this.stocks + this.frozenStocks
    //     }
    // }

    // async placeLimitOrder(type, amount) {
    //     var orderOpt
        
    //     if(![ORDER_TYPE_BUY, ORDER_TYPE_SELL].includes(type) || isNaN(amount)) {
    //         throw "Wrong order input"
    //     }

    //     if(!this.buy1Price || !this.sell1Price) {
    //         throw "orderBooks not available"
    //     }

    //     this.logAccount()

    //     if(type == ORDER_TYPE_BUY) {
    //         var orderPrice = _.ceil(this.buyPrice, 8)
    //         var orderAmount = this.needMoreCoinForBuy? _.floor(amount/(1-this.fee), 5): _.floor(amount, 3)
    //         orderOpt = this.exchangeDelegate.createLimitBuyOrder(this.symbol, orderAmount, orderPrice)
    //         this.log(`限价买单，数量：${orderAmount}，价格：${orderPrice}`, 'green')
    //     }else {
    //         var orderPrice = _.floor(this.sellPrice, 8)
    //         var orderAmount = this.needMoreCoinForBuy?_.floor(amount, 5): _.floor(amount, 3)
    //         orderOpt = this.exchangeDelegate.createLimitSellOrder(this.symbol, orderAmount, orderPrice)
    //         this.log(`限价卖单，数量：${orderAmount}，价格：${orderPrice}`, 'blue')
    //     }      

    //     var result = {}        
    //     try{
    //         result = await orderOpt            
    //     }catch(e){
    //         this.log(e, 'red')            
    //     }        

    //     await util.sleep(this.delay)
    //     return await this.cancelPendingOrders(amount)  
    // }

    // async cancelPendingOrders(amount) {
    //     this.log("开始轮询订单状态")
                
    //     var beforeAccount = this.account
    //     var retryTimes = 0        
    //     var dealAmount = 0
    //     var balanceChanged = 0
    //     var hasPendingOrders = false
    //     var completed = false            

    //     while(retryTimes < 10) {   
    //         await util.sleep(this.delay)  
    //         retryTimes++
    //         var orders = await this.fetchOpenOrders(this.symbol)
    //         if(orders && orders.length > 0) {
    //             hasPendingOrders = true
    //             for(var order of orders) {
    //                 await this.cancelOrder(order.id)                        
    //                 await util.sleep(this.delay)
    //             }
    //             continue
    //         }

    //         await this.fetchAccount()

    //         // 没有挂单，但余额没变，需要重新刷新
    //         if(!hasPendingOrders && beforeAccount.balance == this.balance && beforeAccount.stocks == this.stocks) {                
    //             continue
    //         }           

    //         if(this.frozenStocks == 0 && this.frozenBalance == 0) {
    //             dealAmount = Math.abs(this.stocks - beforeAccount.stocks)
    //             balanceChanged = this.balance - beforeAccount.balance
    //             if(_.round(dealAmount - amount, 3) == 0) completed = true
    //             break
    //         }         
    //     }
    //     this.log("订单轮询处理结束")
    //     return {amount, dealAmount, balanceChanged, completed}
    // }

    // async fetchOpenOrders() {
    //     try {
    //         return await this.exchangeDelegate.fetchOpenOrders(this.symbol)
    //     }catch(e) {
    //         this.log(e, "red")
    //     }   
    //     return null
    // }

    // async cancelOrder(orderID) {
    //     try {
    //         await this.exchangeDelegate.cancelOrder(orderID, this.symbol) 
    //         this.log(`订单 ${orderID} 取消完成`, 'yellow')
    //     }catch(e) {
    //         this.log(e, "red")
    //     }                
    // }

    // async testOrder(buyPrice, sellPrice, amount) {
    //     amount = _.round(amount, 3)
    //     var result = {}
    //     try{
    //         await this.fetchOrderBook()
    //         this.log(`buy1Price: ${this.buy1Price}`, 'yellow')
    //         this.log(`sell1Price: ${this.sell1Price}`, 'yellow')
    //         await this.fetchAccount()        
    //         this.log("开始下买单", 'green')
    //         result = await this.exchangeDelegate.createLimitBuyOrder(this.symbol, amount, buyPrice)            
    //         this.log(result)
    //         result = await this.cancelPendingOrders(amount)
    //         this.log(result)
    //         this.log("开始下卖单", 'blue')
    //         result = await this.exchangeDelegate.createLimitSellOrder(this.symbol, amount, sellPrice)        
    //         this.log(result)
    //         result = await this.cancelPendingOrders(amount)
    //         this.log(result)
    //     }catch(e){
    //         this.log(e, 'red')         
    //     }    
    // }
}
module.exports = Exchange