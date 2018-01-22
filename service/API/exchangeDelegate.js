const EventEmitter = require('events')
const _ = require('lodash')
const util = require ('../../util/util.js')
const Available = require('../../util/available.js')
const RedisDB = require('../db/redisDB')

const ORDER_TYPE_BUY = 'buy'
const ORDER_TYPE_SELL = 'sell'


class ExchangeDelegate extends EventEmitter {
	constructor(api, config, debug=true) {
	    super()
        this.api = api
        this.id = api.id
        this.interval = api.interval
        this.debug = debug
        this.timeout = this.debug? 10000: 1000
        this._configAvailable(config)
    }

    get isAvailable() {
        return this.available.isAvailable
    }

    get isClosed() {
	    return this.available.closed
    }

    async fetchTicker(symbol) {
        try{
            return await util.promiseWithTimeout(
                () => this.api.fetchTicker(symbol),
                this.timeout
            )
        }catch(e){
            this._log(`未获取到Ticker: ${e}`)
            return null
        }
    }
    
    async fetchOrderBook(symbol) {
        try{
            var pram = this.id == "binance"? {}: {
                'limit_bids': 10,
                'limit_asks': 10,
                'group': 1, // 1 = orders are grouped by price, 0 = orders are separate
                'depth': 10,
                'size': 10,
                // 'type': 'step5'
            }
            return await util.promiseWithTimeout(
                () => this.api.fetchOrderBook(symbol, pram),
                this.timeout
            )
        }catch(e){
            this._debugLog(`未获取到orderbook: ${e.message}`, 'red')
            return null
        }
    }

    async fetchAccount(symbol) {
        try {
            let balance = await this.api.fetchBalance()
            let account = this.parseAccount(balance, symbol)
            this.emit('account', balance)
            this._logAccount(symbol, account)
            return account
        }catch(e) {
            this._reportIssue(e)
            return null
        }
    }

    async createLimitOrder(symbol, type, amount, price, accountInfo) {
        this._logAccount(symbol, accountInfo)
        try{
            if(type == ORDER_TYPE_BUY) {
                await this.api.createLimitBuyOrder(symbol, amount, price)
            }else {
                await this.api.createLimitSellOrder(symbol, amount, price)
            }
        }catch(e){
            this._reportIssue(e)
        }
        await util.sleep(this.interval * 2)
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
            this._log(`订单轮询处理完成, 成交量: ${dealAmount}, 余额变化: ${balanceChanged}`, "green")
        }else {
            this._reportIssue({message: "订单轮询处理失败"}, true)
        }        
        return {
            info: {amount, dealAmount, balanceChanged, completed},
            newAccount
        }        
    }

    parseAccount(data, symbol) {
        var pair = this._parseSymbol(symbol)
        var fiat = pair.fiat, crypto = pair.crypto
        if(!data || (!data[fiat] && !data[crypto])) return null
        var account = {
            balance: data[fiat]? this._adjust(data[fiat].free): 0,
            frozenBalance: data[fiat]? this._adjust(data[fiat].used): 0,
            stocks: data[crypto]? this._adjust(data[crypto].free): 0,
            frozenStocks: data[crypto]? this._adjust(data[crypto].used): 0
        }
        // this._logAccount(symbol, account)
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
            this._log(`订单 ${orderID} 取消完成`, 'magenta')
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

    _logAccount(symbol, account) {
        this._log(`${symbol} - balance: ${account.balance}, frozenBalance: ${account.frozenBalance}, stocks: ${account.stocks}, frozenStocks: ${account.frozenStocks}`, 'yellow')
    }

    _log(message, color='white') {
        util.log[color](this.id, message)
    }

    _debugLog(message, color='white') {
        if(this.debug) this._log(message, color)
    }

    _adjust(number) {
	    return _.floor(number, 10)
    }

    _reportIssue(err, isFatal=false) {
        this._log(err.message, 'red')
        this.available.reportIssue(isFatal)
    }

    _configAvailable(config) {
        var that = this
        this.available = new Available(config.failureInterval, config.failureThreshold, config.retryDelay, config.retryInterval, config.retryThreshold)
        this.available.on('check', async function(){
            await that._checkAvailable()
        })
        this.available.on('closed', async function() {
            let database = await RedisDB.getInstanceWithAccount()
            await database.recordClosedAPI(that.id)
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

    async testErr(isFatal=false) {
	    if(isFatal) {
            this._reportIssue({message: "test fatal err"}, true)
        }else {
            this._reportIssue({message: "test err"})
        }
    }
}

module.exports = ExchangeDelegate