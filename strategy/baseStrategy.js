const util = require ('../util/util.js')
const Database = require('../service/database.js')

class Strategy {

	constructor(symbol,fiat){
        // super()
        this.symbol = symbol
        this.fiat = fiat      
    }

	async init(exchanges){
		this.exchanges = exchanges
		this.database = new Database(this.constructor.name)		
		await this.reportBalance()
	}

	async reportBalance() {
		this.currBalance = 0
		this.currStock = 0
		var idList = []
		for(let [id, exchange] of Object.entries(this.exchanges)) {			
			this.currBalance +=  exchange.balance + exchange.frozenBalance
			this.currStock += exchange.stocks + exchange.frozenStocks
			idList.push(exchange.id)
		}
		if(!this.initBalance && !this.initStock) {
			this.initBalance = this.currBalance
			this.initStock = this.currStock
			await this.database.init(this.initBalance, this.initStock, idList)
		}		
		this.balanceDiff = this.currBalance - this.initBalance
		this.stockDiff = this.currStock - this.initStock
		
		await this.database.recordBalance(this.balanceDiff, this.stockDiff)
		util.log.red(`盈利: ${this.balanceDiff}, 币差: ${this.stockDiff}`)		
	}

	condition() {
		if(Math.abs(this.stockDiff) > 0.8 || this.balanceDiff < -100) {
			util.log("账户异常，退出交易")
			return false
		}
		return true
	}

	doTrade() {
		util.log("doTrade() must be implemented, exiting app")
		process.exit()
	}
}
module.exports = Strategy