const ccxt = require ('ccxt')
const _ = require('lodash')
const util = require ('../../util/util.js')
const Available = require('./available.js')
const EventEmitter = require('events')

const ORDER_TYPE_BUY = 'buy'
const ORDER_TYPE_SELL = 'sell'


class ExchangeDelegate extends EventEmitter {
	constructor(api, debug) {   
        super()   
        this.api = api
        this.id = api.id
        this.interval = api.interval
        this.debug = debug
        // this.available = new Available(this._checkAvailable)        
        // this.setupEvent()
    }

    // setupEvent() {
    //     var that = this
    //     this.available.on('open', function(){
    //         that._nofify('open')
    //     })

    //     this.available.on('close', function(){
    //         that._nofify('close')
    //     }) 
    // }

    // get isAvailable() {
    //     return this.available.isAvailable
    // }
    
    async fetchOrderBook(symbol) {
        var orderBooks = null
        try{          
            orderBooks = await util.promiseWithTimeout(                
                () => this.api.fetchOrderBook(symbol, {
                    'limit_bids': 5,
                    'limit_asks': 5,
                    'group': 1, // 1 = orders are grouped by price, 0 = orders are separate
                    'depth': 5,
                    'size': 5,            
                }),
                1000
            )

        }catch(e){
            // orderBooks = null
        }
        return orderBooks
    }

    async fetchAccount(symbol) {
        var data = null
        try {
            data = await this.api.fetchBalance()                                      
            // this._status = true
        }catch(e) {
            // this._status = false
            this._log(e, 'red')
        }
        return this._parseAccount(data, symbol)
    }

    async createLimitOrder(symbol, type, amount, price, accountInfo) {
        try{
            this._logAccount(accountInfo)
            if(type == ORDER_TYPE_BUY) {
                await this.api.createLimitBuyOrder(symbol, amount, price)
            }else {
                await this.api.createLimitSellOrder(symbol, amount, price)  
            }           
            // this._status = true         
        }catch(e){
            // this._status = false
            this._log(e, 'red')            
        }
        await util.sleep(this.interval)
        return await this._cancelPendingOrders(symbol, amount, accountInfo)     
    }

    async _cancelPendingOrders(symbol, amount, accountInfo) {
        this._log("开始轮询订单状态")
                
        var beforeAccount = accountInfo
        var newAccount = beforeAccount
        var retryTimes = 0        
        var dealAmount = 0
        var balanceChanged = 0
        var hasPendingOrders = false
        var completed = false            

        while(retryTimes < 10) {   
            await util.sleep(this.interval)  
            retryTimes++
            var orders = await this._fetchOpenOrders(symbol)
            if(orders && orders.length > 0) {
                hasPendingOrders = true
                for(var order of orders) {
                    await this._cancelOrder(order.id, symbol)                        
                    await util.sleep(this.interval)
                }
                continue
            }

            newAccount = await this.fetchAccount(symbol)

            // 获取账户失败
            if(!newAccount) {
                continue
            }

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
            // this._status = true
            this._log("订单轮询处理完成", "green")
        }else {
            // this._status = false
            this._log("订单轮询处理失败", "red")
        }        
        return {
            info: {amount, dealAmount, balanceChanged, completed},
            newAccount
        }        
    }

    _parseAccount(data, symbol) {
        if(!data) return null
        var pair = this._parseSymbol(symbol)
        var fiat = pair.fiat, crypto = pair.crypto
        var account = {
            balance: data[fiat]? data[fiat].free: 0,
            frozenBalance: data[fiat]? data[fiat].used: 0,
            stocks: data[crypto]? data[crypto].free: 0,
            frozenStocks: data[crypto]? data[crypto].used: 0
        }
        this._logAccount(account)
        return account
    }

    async _fetchOpenOrders(symbol) {
        try {
            return await this.api.fetchOpenOrders(symbol)
        }catch(e) {
            this._log(e, "red")
        }   
        return null
    }

    async _cancelOrder(orderID, symbol) {
        try {
            await this.api.cancelOrder(orderID, symbol) 
            this._log(`订单 ${orderID} 取消完成`, 'yellow')
        }catch(e) {
            this._log(e, "red")
        }                
    }

    _parseSymbol(symbol) {
        var pair = _.split(symbol, '/')
        return {
            crypto: pair[0],
            fiat: pair[1]
        }
    }

    _logAccount(account) {
        this._log(`balance: ${account.balance}, frozenBalance: ${account.frozenBalance}, stocks: ${account.stocks}, frozenStocks: ${account.frozenStocks}`, 'yellow')
    }

    _log(message, color='white') {
        if(this.debug) util.log[color](this.id, message)
    }

    // async _checkAvailable() {
    //     this._log(`自动检测 ${this.id} API可用性`)
    //     var account, cancelResult
    //     try{            
    //         account = await this.fetchAccount()
    //     }catch(e) {
    //         return false
    //     }
    //     if(account.balance + account.stocks == 0 || orderBooks == null) {
    //         return false
    //     }
    //     return true
    // }

    // _nofify(status) {
    //     this.emit(status)
    // }

    // set _status(success) {
    //     this.available.checkin(success)
    // }
}

module.exports = ExchangeDelegate