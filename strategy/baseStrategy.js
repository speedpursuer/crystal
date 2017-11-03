const util = require ('../util/util.js')
const database = require('../service/database.js')

class Strategy {

	constructor(crypto,fiat, debug=true){
        this.crypto = crypto
        this.fiat = fiat
        this.debug = debug      
    }

	async init(exchanges){
		this.exchanges = exchanges
		// this.database = new Database(this.constructor.name)		
		await this.updateBalance(false)
	}

	async updateBalance(print=true) {
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
			this.database = await database.initAccount(this.constructor.name, this.initBalance, this.initStock, idList)
		}		
		this.balanceDiff = this.currBalance - this.initBalance
		this.stockDiff = this.currStock - this.initStock
		
		await this.database.recordBalance(this.balanceDiff, this.stockDiff)
		if(print) {
			util.log.red(`盈利: ${this.balanceDiff}, 币差: ${this.stockDiff}, 总金额: ${this.currBalance}, 总币数: ${this.currStock}`)	
		}		
	}

	condition() {
		if(Math.abs(this.stockDiff) > 2 || Math.abs(this.balanceDiff) > 0.5) {
			util.log("账户异常，退出交易")
			return false
		}
		return true
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