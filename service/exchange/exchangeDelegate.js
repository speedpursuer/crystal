const EventEmitter = require('events')
const _ = require('lodash')
const util = require ('../../util/util.js')
const Available = require('../API/util/available.js')
const AppLog = require('../db/appLog')
const PendingOrder = require('./class/pendingOrder')

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
            this._log(`未获取到orderbook: ${e.message}`, 'red')
            return null
        }
    }

    async fetchAccount(symbol) {
        let balance = await this._fetchBalance()
        let account = this.parseAccount(balance, symbol)
        this._logAccount(symbol, account)
        return account
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
        await util.sleep(this.interval * 3)
        return await this._checkPendingOrders(symbol, amount, accountInfo)
    }

    async _checkPendingOrders(symbol, amount, accountInfo, hasPendingOrders = false) {
        this._log("开始订单状态检查")
                
        let beforeAccount = accountInfo
        let newAccount = beforeAccount
        let retryTimes = 0
        let dealAmount = 0
        let balanceChanged = 0
        let completed = false

        while(retryTimes < 10) {
            retryTimes++
            await util.sleep(this.interval * retryTimes)
            let orders = await this._fetchOpenOrders(symbol)
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

            // 有冻结，重新刷新
            if(newAccount.frozenStocks !== 0 || newAccount.frozenBalance !== 0) {
                continue
            }

            dealAmount = this._diff(newAccount.stocks, beforeAccount.stocks)
            balanceChanged = this._diff(newAccount.balance, beforeAccount.balance)

            // 没有挂单，但余额没变，需要重新刷新
            if(!hasPendingOrders && dealAmount === 0  && balanceChanged === 0) {
                continue
            }

            // 钱和币不一致，重新刷新
            if(!this._checkOrderCompletion(dealAmount, balanceChanged)) {
                continue
            }

            // 成功，跳出循环
            completed = true
            break
        }

        let orderResult = {amount, dealAmount, balanceChanged, completed, hasPendingOrders}
        this._processOrderResult(symbol, accountInfo, orderResult)

        return {
            info: orderResult,
            newAccount
        }        
    }

    _processOrderResult(symbol, beforeAccount, orderResult) {
        if(orderResult.completed) {
            if(orderResult.dealAmount === 0) {
                this._reportIssue({message: "下单量为0，下单失败"})
            }
            this._log(`订单状态检查成功, 成交量: ${orderResult.dealAmount}, 余额变化: ${orderResult.balanceChanged}`, "green")
        }else {
            this._reportIssue({message: "订单状态检查失败"}, true)
            if(!this.pendingOrder) {
                this.pendingOrder = new PendingOrder(symbol, beforeAccount, orderResult.amount, orderResult.hasPendingOrders)
            }
        }
    }

    _checkOrderCompletion(dealAmount, balanceChanged) {
	    if(dealAmount !== 0 && balanceChanged !== 0) {
	        //成功下单
            return true
        }else if (dealAmount === 0 && balanceChanged === 0) {
            //下单失败
            return true
        }else {
	        //账户数据不一致，需重新获取
            return false
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
        return account
    }

    async _fetchBalance() {
        try {
            let balance = await this.api.fetchBalance()
            if(balance) this.emit('balanceUpdate', balance)
            return balance
        }catch(e) {
            this._reportIssue(e)
            return null
        }
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
	    if(account) {
            this._log(`${symbol} - 余钱: ${account.balance}, 冻结钱: ${account.frozenBalance}, 余币: ${account.stocks}, 冻结币: ${account.frozenStocks}`, 'yellow')
        }
    }

    _log(message, color='white') {
        if(this.debug) util.log[color](this.id, message)
    }

    _adjust(number) {
	    return _.floor(number, 10)
    }

    _diff(n1, n2) {
	    return _.round(n1 - n2, 5)
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
            that._log(`API调用失败次数过多，永久关闭`, "red")
            // that.emit('closed')
            that.api.disconnectStream()
            await AppLog.instance.recordClosedAPI(that.id)
        })
        this.available.on('stopped', async function(){
            that._log(`API调用失败，暂停使用，稍后自动重试`, "red")
            // that.emit('stopped')
        })
    }

    async _checkAvailable() {
        this._log(`自动检测 ${this.id} API可用性`)

        if(await this._checkAPI()) {
            this._log(`API恢复正常`, "green")
            this.api.reconnectStream()
            this.available.reportCheck(true)
            // this.emit('reopen')
        }else{
            this._log(`AIP恢复失败`, "red")
            this.available.reportCheck(false)
            // this.emit('stopped')
        }
    }

    async _checkAPI() {
        try{
            if(this.pendingOrder) {
                return await this._recheckPendingOrders()
            }else {
                return await this.api.fetchBalance()
            }
        }catch(e) {
            this._log(e)
            return false
        }
    }

    async _recheckPendingOrders() {
        let checkResult = await this._checkPendingOrders(
            this.pendingOrder.symbol,
            this.pendingOrder.orderAmount,
            this.pendingOrder.beforeAccount,
            this.pendingOrder.hasPendingOrders
        )

        let lastOrderAmount = this.pendingOrder.checkPendingOrder(
            checkResult.info.completed,
            checkResult.info.dealAmount,
            checkResult.info.hasPendingOrders
        )

        if(lastOrderAmount !== null) {
            this.pendingOrder = null
            this._log(`上次失败订单最终下单量: ${lastOrderAmount}`, 'blue')
            return true
        }else {
            return false
        }
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