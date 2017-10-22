const util = require ('../util/util.js')
const factory = require ('./exchangeFactory.js')

const ORDER_STATE_PENDING = 'open'
// const ORDER_STATE_CLOSED = 'closed'
// const ORDER_STATE_CANCELED = 'cancelled'
const ORDER_TYPE_BUY = 'buy'
const ORDER_TYPE_SELL = 'sell'
const RetryDelay = 200

class Exchange {

	constructor(id, crypto, debug=false) {
		this.exchangeEntity = factory.createExchange(id)      
        
        this.fee = this.exchangeEntity.fee
        this.id = this.exchangeEntity.id
        this.slippage = this.exchangeEntity.slippage
        this.fiat = this.exchangeEntity.fiat
        
        this.crypto = crypto
        this.debug = debug 

        this.balance = 0
        this.stocks = 0
        this.frozenBalance = 0
        this.frozenStocks = 0
        this.orderBooks
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

    payForBuy(amount) {        
        return amount * this.sell1Price * (1+this.slippage) / (1-this.fee)
    }

    earnForSell(amount) {
        return amount * this.buy1Price * (1-this.slippage) * (1-this.fee)
    }

    fetchOrderBook() {
        var self = this
        return this.exchangeEntity.fetchOrderBook(this.symbol, {
            // 'limit_bids': 5,
            // 'limit_asks': 5,
            // 'group': 0, // 1 = orders are grouped by price, 0 = orders are separate
        })
        .then(function(orderBooks){            
            self.orderBooks = orderBooks
            return orderBooks
        })
        .catch(function(e){
            throw e
        })
    }

    getAccount() {
        var self = this
        return this.exchangeEntity.fetchBalance()
        .then(function(account){
            self.balance = account[self.fiat].free
            self.frozenBalance = account[self.fiat].used
            self.stocks = account[self.crypto].free 
            self.frozenStocks = account[self.crypto].used
            if(self.debug) {                
                util.log.green(self.id, "balance: ", self.balance, "frozenBalance: ", self.frozenBalance, "stocks: ", self.stocks, "frozenStocks: ", self.frozenStocks)  
            }
            return account
        })
        .catch(function(e) {
            throw e
        })   
    }

    limitBuy(amount) {  
        return this.placeLimitOrder(ORDER_TYPE_BUY, amount)
    }

    limitSell(amount) {  
        return this.placeLimitOrder(ORDER_TYPE_SELL, amount)
    }   

    placeLimitOrder(type, amount) {    
        var orderID
        var self = this
        var orderOpt
        
        if(![ORDER_TYPE_BUY, ORDER_TYPE_SELL].includes(type) || isNaN(amount)) {
            throw "Wrong order input"
        }

        if(!this.buy1Price || !this.sell1Price) {
            throw "orderBooks not available"
        }

        if(type == ORDER_TYPE_BUY) {
            orderOpt = this.exchangeEntity.createLimitBuyOrder(this.symbol, amount, util.toFixedNumber(this.sell1Price * (1 + this.slippage), 1))
            util.log.green(`${self.id} - 限价买单，数量：${amount}，价格：${util.toFixedNumber(this.sell1Price * (1 + this.slippage), 1)}`)
        }else {
            orderOpt = this.exchangeEntity.createLimitSellOrder(this.symbol, amount, util.toFixedNumber(this.buy1Price * (1 - this.slippage), 1))
            util.log.blue(`${self.id} - 限价卖单，数量：${amount}，价格：${util.toFixedNumber(this.buy1Price * (1 - this.slippage), 1)}`)
        }      
        return orderOpt  
        .then(function(result) {
            if(result.id) {
                if(self.debug) util.log.yellow("下单完成，开始检查订单状态")
                orderID = result.id
                return util.sleep(RetryDelay)
            }else {
                throw "placing order failed"
            }                        
        })
        .then(function(){
            return self.cancelOrder(orderID)
        })        
        .catch(function(e){
            throw e
        })        
    }

    cancelOrder(orderID) {
        var order
        var self = this
        return util.promiseWhile(function() {            
            if(!order) {
                return true
            }else if(order.status == ORDER_STATE_PENDING || 
                self.frozenBalance != 0 || self.frozenStocks != 0) {
                return true
            }else{
                if(self.debug) {
                    util.log.green(`订单 (${orderID}) 已成功处理`)
                }
                return false
            }            
        }, function() {
            return self.exchangeEntity.fetchOrder(orderID)
            .then(function(od){
                order = od
                if(self.debug) util.log.yellow(`下单已获取，状态为：${order.status}`)
                if(order && order.status == ORDER_STATE_PENDING) {
                    util.log.red(`${self.id} - 订单 (${orderID}) 未成功，将取消`)
                    return self.exchangeEntity.cancelOrder(orderID)
                }       
            })            
            .then(function(data){
                if(self.debug) util.log.yellow(`取消订单，返回数据：${data}`)
                return self.getAccount()
            })            
        })
        .then(function() {
            return order
        })
        .catch(function(e){
            throw e
        })             
    }

    async testOrder() {

        try{
            await this.getAccount()        
            util.log(this.id, "开始下单")
            var result
            if(this.balance >= 35) {
                result = await this.exchangeEntity.createLimitBuyOrder(this.symbol, 0.005, 3000)
            }else {
                result = await this.exchangeEntity.createLimitSellOrder(this.symbol, 0.005, 10000)
            }
            util.log("下单完成, 开始轮询状态")
        }catch(e){
            util.log.red(e)            
        }

        while(true) {

            await util.sleep(200)

            try{
                var order = await this.exchangeEntity.fetchOrder(result.id, this.symbol)
                util.log("订单状态", order.status)

                // exchange.fetchOpenOrders

                if(order.status == 'open') {
                    var result1 = await this.exchangeEntity.cancelOrder(result.id, this.symbol)    
                    util.log("取消完成，结果", result1)
                }
                
                await this.getAccount()

                if(this.frozenStocks == 0 && this.frozenBalance == 0 && order.status != 'open') {
                    break
                }
            }catch(e){               
                util.log.red(e)
                continue
            }            
        }          
    }

    async testOrder1() {        

        var result = {}
        try{
            await this.getAccount()        
            // this.beforeBalance = {
            //     totalBalance: this.balance + this.frozenBalance,
            //     totalStocks: this.stocks + this.frozenStocks
            // }
            util.log(this.id, "开始下单")            
            if(this.balance >= 35) {
                result = await this.exchangeEntity.createLimitBuyOrder(this.symbol, 0.005, 3000)
            }else {
                result = await this.exchangeEntity.createLimitSellOrder(this.symbol, 0.005, 10000)
            }            
        }catch(e){
            util.log.red(e)
            await util.sleep(4 * RetryDelay)
        }

        await this.cancelPendingOrders(result.id)   
    }

    async cancelPendingOrders(orderID) {
        util.log(this.id, "开始轮询订单状态")

        var retryTime = 0

        while(retryTime < 5) {
            try{                
                util.log("--------------------------------")
                await util.sleep(RetryDelay)

                if(orderID) {
                    var order = await this.exchangeEntity.fetchOrder(orderID, this.symbol)
                    if(order && order.status == 'open') {
                        await this.exchangeEntity.cancelOrder(order.id)    
                        util.log.yellow(this.id, `订单 ${order.id} 取消完成`)
                        continue
                    }
                }

                var orders = await this.exchangeEntity.fetchOpenOrders(this.symbol)

                if(orders && orders.length > 0) {
                    for(var order of orders) {
                        await this.exchangeEntity.cancelOrder(order.id)  
                        util.log.yellow(this.id, `订单 ${order.id} 取消完成`)
                        util.sleep(RetryDelay)
                    } 
                    continue
                }

                await this.getAccount()

                if(this.frozenStocks == 0 && this.frozenBalance == 0) {
                    break
                }
                
                // let [orders, singleOrder, account] = await Promise.all([
                    
                //     this.exchangeEntity.fetchOrder(orderID, this.symbol),
                //     this.getAccount()
                // ])     

                // // util.log(orders, singleOrder)

                // // break       
                // // util.log("this.frozenStocks", this.frozenStocks)
                // // util.log("this.frozenBalance", this.frozenBalance)
                // util.log("orders.length", orders.length)
                // util.log("singleOrder.status", singleOrder.status)
                // // util.log("this.totalBalance", this.totalBalance)
                // // util.log("this.totalStocks", this.totalStocks)
                // // util.log("this.beforeBalance.totalBalance", this.beforeBalance.totalBalance)
                // // util.log("this.beforeBalance.totalStocks", this.beforeBalance.totalStocks)


                // if(this.frozenStocks == 0 && this.frozenBalance == 0 && orders.length == 0 && 
                //     (!singleOrder || singleOrder.status != 'open')) {
                //     // this.totalBalance != this.beforeBalance.totalBalance &&
                //     // this.totalStocks != this.beforeBalance.totalStocks) {
                //     util.log("无可取消订单，完成")
                //     break
                // }                

                // if(singleOrder && singleOrder.status == 'open') {
                //     util.log(`订单 ${singleOrder.id} 需要取消`)
                //     await this.exchangeEntity.cancelOrder(singleOrder.id)    
                //     util.log(`订单 ${singleOrder.id} 取消完成`)
                //     continue
                // }

                // if(orders.length > 0) {
                //     util.log(`有 ${orders.length} 个订单需要取消`)
                // }

                // for(var order of orders) {
                //     util.log(`订单 ${order.id}, 状态：${order.status}`)
                //     await this.exchangeEntity.cancelOrder(order.id)  
                //     util.log(`订单 ${order.id} 取消完成`)
                //     util.sleep(RetryDelay)
                // }                
            }catch(e){                       
                util.log.red(e)
                retryTime++                
            }        
        }        
    }

    get symbol() {
        return `${this.crypto}/${this.fiat}`
    }

    getOrderBooksData(path) {
        var value = util.deepGet(this.orderBooks, path)
        return value === undefined? 0: value
    }
}
module.exports = Exchange