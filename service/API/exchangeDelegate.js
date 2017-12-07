const ccxt = require ('ccxt')
const _ = require('lodash')
const util = require ('../../util/util.js')
const Available = require('./available.js')

const ORDER_TYPE_BUY = 'buy'
const ORDER_TYPE_SELL = 'sell'


class ExchangeDelegate {
	constructor(api, debug=true) {
        this.api = api
        this.id = api.id
        this.interval = api.interval
        this.debug = debug
        this._configAvailable()
    }

    get isAvailable() {
        return this.available.isAvailable
    }

    async fetchTicker(symbol) {
        try{
            return await util.promiseWithTimeout(
                () => this.api.fetchTicker(symbol),
                1000
            )
        }catch(e){
            this._log(`未获取到Ticker: ${e}`)
            return null
        }
    }
    
    async fetchOrderBook(symbol) {
        try{
            var pram = this.id == "binance"? {}: {
                'limit_bids': 5,
                'limit_asks': 5,
                'group': 1, // 1 = orders are grouped by price, 0 = orders are separate
                'depth': 5,
                'size': 5,
                // 'type': 'step5'
            }
            return await util.promiseWithTimeout(
                () => this.api.fetchOrderBook(symbol, pram),
                1000
            )
        }catch(e){
            // this._log(`未获取到orderbook: ${e.message}`)
            return null
        }
    }

    async fetchAccount(symbol) {
        try {
            return this._parseAccount(await this.api.fetchBalance(), symbol)
        }catch(e) {
            this._reportIssue(e)
            return null
        }
    }

    async createLimitOrder(symbol, type, amount, price, accountInfo) {
        this._logAccount(accountInfo)
        try{
            if(type == ORDER_TYPE_BUY) {
                await this.api.createLimitBuyOrder(symbol, amount, price)
            }else {
                await this.api.createLimitSellOrder(symbol, amount, price)
            }
        }catch(e){
            this._reportIssue(e)
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
            this._log("订单轮询处理完成", "green")
        }else {
            this._reportIssue({message: "订单轮询处理失败"}, true)
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
            balance: data[fiat]? this._round(data[fiat].free): 0,
            frozenBalance: data[fiat]? this._round(data[fiat].used): 0,
            stocks: data[crypto]? this._round(data[crypto].free): 0,
            frozenStocks: data[crypto]? this._round(data[crypto].used): 0
        }
        this._logAccount(account)
        return account
    }

    async _fetchOpenOrders(symbol) {
        try {
            return await this.api.fetchOpenOrders(symbol)
        }catch(e) {
            this._reportIssue(e)
            return null
        }
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

    _round(number) {
	    return _.round(number, 5)
    }

    _reportIssue(err, isFatal=false) {
        this._log(err.message, 'red')
        this.available.reportIssue(isFatal)
    }

    _configAvailable() {
        var that = this
        this.available = new Available()
        this.available.on('check', function(){
            that._checkAvailable()
        })
    }

    async _checkAvailable() {
        this._log(`自动检测 ${this.id} API可用性`)
        try{
            if(await this.api.fetchBalance()) {
                this._log(`API恢复正常`, "green")
                return this.available.reportCheck(true)
            }
        }catch(e) {
        }
        this._log(`AIP恢复失败`, "red")
        this.available.reportCheck(false)
    }
}

module.exports = ExchangeDelegate