const _ = require('lodash')
const util = require ('../util/util.js')
const TradeLog = require('../service/db/tradeLog')
const cryptoInfo = require('../config/cryptoInfo.js')

class BaseStrategy {

	constructor(crypto, fiat, config){
        this.crypto = crypto
        this.fiat = fiat
		this.config = config
        this.debug = this.getConfig("debug")
		this.maxLoss = this.getConfig("maxLoss")
		this.failed = false
    }

	async init(exchanges){
		this._exchanges = exchanges
        this.balanceDiff = 0
        this.stockDiff = 0
		await this.initTradeLog()
	}

	async initTradeLog() {
		let totalBalance = 0, totalStock = 0
        _.forEach(this._exchanges, function(exchange) {
            totalBalance +=  exchange.balance + exchange.frozenBalance
            totalStock += exchange.stocks + exchange.frozenStocks
		})
		this.tradeLog = new TradeLog()
		await this.tradeLog.init(this.market, totalBalance, totalStock, _.keys(this._exchanges))
	}

    beforeTrade() {
        this.beforeAccount = this.getCurrBalance()
    }

    afterTrade() {
        this.afterAccount = this.getCurrBalance()
        this.balanceDiff += this.afterAccount.currBalance - this.beforeAccount.currBalance
        this.stockDiff += this.afterAccount.currStock - this.beforeAccount.currStock
    }

    async updateBalance() {
        if (this.needReport) {
            this.logProfit()
            await this.tradeLog.recordBalance(this.currProfit, this.balanceDiff, this.stockDiff)
            this.needReport = false
        }
    }

    getCurrBalance() {
        let currBalance = 0, currStock = 0
        _.forEach(this._exchanges, function(exchange) {
            currBalance +=  exchange.balance + exchange.frozenBalance
            currStock += exchange.stocks + exchange.frozenStocks
        })
        return {currBalance, currStock}
    }

	logProfit() {
		util.log.red(`盈利：${this.currProfit}, 钱差: ${this.balanceDiff}, 币差: ${this.stockDiff}`)
	}

	get condition() {
		if(this.failed) return false
		if(this.currProfit < this.maxLoss) {
			let err = `${this.market} has too much loss, trading stopped`
            util.log.red(err)
			this.tradeLog.recordStopped(err).then
			this.failed = true
			return false
		}
		return true
	}

	get currProfit() {
		return this.balanceDiff + (this.stockDiff) * this.avgPrice
	}

	get avgPrice() {
		return _.mean(_.map(this.exchanges, function(e) {
		  	return e.sellPrice
		}))
	}

	get allExchanges() {
		return this._exchanges
	}

	get exchanges() {
		var that = this
		return _.filter(this._exchanges, function(e) { 
			if(!e.orderBooks || !e.isAvailable) {
				return false
			}else if(!cryptoInfo[that.market]){
				return true				
			}else {
				if(_.inRange(e.sellPrice, cryptoInfo[that.market].min, cryptoInfo[that.market].max) &&
				   _.inRange(e.buyPrice, cryptoInfo[that.market].min, cryptoInfo[that.market].max)) {
					return true
				}else {
					return false
				}
			}
		})
	}

	get market() {
		return `${this.crypto}/${this.fiat}`
	}

	action(text) {
        this.log("---------------------------------------------")
    	this.log(text)
        this.needReport = true
	}

	log(message) {
		if(this.debug) util.log(this.market, message)
	}

    before() {
	}

    getConfig(name) {
        var value = util.deepGet(this.config, name)
        if(value === undefined) {
        	throw `${name} not found in config`
		}
		return value
    }
	
	doTrade() {
		throw new Error("doTrade() must be implemented")
	}
}
module.exports = BaseStrategy