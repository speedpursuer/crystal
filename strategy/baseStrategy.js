const _ = require('lodash')
const util = require ('../util/util.js')
const database = require('../service/database.js')
const cryptoInfo = require('../config/cryptoInfo.js')

class Strategy {

	constructor(crypto,fiat, debug=true){
        this.crypto = crypto
        this.fiat = fiat
        this.debug = debug      
    }

	async init(exchanges){
		this._exchanges = exchanges
		await this.updateBalance()
	}

	async updateBalance() {
		this.currBalance = 0
		this.currStock = 0

		var that = this
		_.forEach(this._exchanges, function(exchange) {
		  	that.currBalance +=  exchange.balance + exchange.frozenBalance
			that.currStock += exchange.stocks + exchange.frozenStocks
		})

		if(!this.initBalance && !this.initStock) {
			this.initBalance = this.currBalance
			this.initStock = this.currStock
			this.database = await database.initAccount(this.constructor.name, this.initBalance, this.initStock, _.keys(this._exchanges))
		}		
		this.balanceDiff = this.currBalance - this.initBalance
		this.stockDiff = this.currStock - this.initStock
		
		await this.database.recordBalance(this.currProfit, this.balanceDiff, this.stockDiff)		
	}

	logProfit() {
		util.log.red(`盈利：${this.currProfit}, 钱差: ${this.balanceDiff}, 币差: ${this.stockDiff}`)
	}

	get condition() {
		if(this.currProfit < -0.001) {
			util.log.red("账户异常，退出交易")
			return false
		}
		return true
	}

	get currProfit() {		
		var avgPrice = _.mean(_.map(this.exchanges, function(e) {
		  	return e.sellPrice
		}))
		return this.balanceDiff + (this.stockDiff) * avgPrice
	}

	get exchanges() {
		var that = this
		return _.filter(this._exchanges, function(e) { 
			if(!e.orderBooks) {
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

	log(message) {
		if(this.debug) util.log(message)
	}

	doTrade() {
		util.log("doTrade() must be implemented, exiting app")
		process.exit()
	}
}
module.exports = Strategy