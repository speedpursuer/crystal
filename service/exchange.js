const util = require ('../util/util.js')
const factory = require ('./exchangeFactory.js')

const ORDER_STATE_PENDING = 'open'
const ORDER_TYPE_BUY = 'buy'
const ORDER_TYPE_SELL = 'sell'
const RetryDelay = 200

class Exchange {
	constructor(id, crypto, debug=false) {
		this.exchangeDelegate = factory.createExchange(id)      
        
        this.fee = this.exchangeDelegate.fee
        this.id = this.exchangeDelegate.id
        this.slippage = this.exchangeDelegate.slippage
        this.fiat = this.exchangeDelegate.fiat
        
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
        this.orderBooks = await this.exchangeDelegate.fetchOrderBook(this.symbol)
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
            var orderPrice = util.toFixedNumber(this.sell1Price * (1 + this.slippage), 1)
            orderOpt = this.exchangeDelegate.createLimitBuyOrder(this.symbol, amount, orderPrice)
            this.log(`限价买单，数量：${amount}，价格：${orderPrice}`, 'green', true)
        }else {
            var orderPrice = util.toFixedNumber(this.buy1Price * (1 - this.slippage), 1)
            orderOpt = this.exchangeDelegate.createLimitSellOrder(this.symbol, amount, orderPrice)
            this.log(`限价卖单，数量：${amount}，价格：${orderPrice}`, 'green', true)
        }      

        var result = {}        
        try{
            result = await orderOpt          
        }catch(e){
            this.log(e, 'red')
            await util.sleep(4 * RetryDelay)
        }        

        await this.cancelPendingOrders(result.id)     
    }

    async cancelPendingOrders(orderID) {
        this.log("开始轮询订单状态")
        var retryTime = 0
        while(retryTime < 5) {
            try{
                this.log("--------------------------------")
                await util.sleep(RetryDelay)
                if(orderID) {
                    var order = await this.exchangeDelegate.fetchOrder(orderID, this.symbol)
                    if(order && order.status == 'open') {
                        await this.cancelOrder(order)                        
                        continue
                    }
                }

                var orders = await this.exchangeDelegate.fetchOpenOrders(this.symbol)
                if(orders && orders.length > 0) {
                    for(var order of orders) {
                        await this.cancelOrder(order)                        
                        util.sleep(RetryDelay)
                    } 
                    continue
                }

                await this.fetchAccount()
                if(this.frozenStocks == 0 && this.frozenBalance == 0) {
                    break
                }                    
            }catch(e){          
                this.log(e, 'red')             
                retryTime++                
            }        
        }
        this.log("订单轮询处理结束")
    }

    async cancelOrder(order) {
        await this.exchangeDelegate.cancelOrder(order.id) 
        this.log(`订单 ${order.id} 取消完成`, 'yellow')
    }

    getOrderBooksData(path) {
        var value = util.deepGet(this.orderBooks, path)
        return value === undefined? 0: value
    }

    log(message, color='white', always=false) {
        if(this.debug || always) util.log[color](this.id, message)
    }

    async testOrder() {
        var result = {}
        try{
            await this.fetchAccount()
            this.log("开始下单")
            if(this.balance >= 35) {
                result = await this.exchangeDelegate.createLimitBuyOrder(this.symbol, 0.005, 3000)
            }else {
                result = await this.exchangeDelegate.createLimitSellOrder(this.symbol, 0.005, 10000)
            }            
        }catch(e){
            this.log(e, 'red')
            await util.sleep(4 * RetryDelay)
        }

        await this.cancelPendingOrders(result.id)   
    }
}
module.exports = Exchange