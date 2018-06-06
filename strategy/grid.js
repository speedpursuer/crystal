const util = require ('../util/util.js')
const _ = require('lodash')

const maxAmountOnce = 0.1

class Grid {
    constructor(basePrice, baseStock, priceRange, gridSize, maxAmountOnce, exchange) {
        this.basePrice = basePrice
        // this.priceRange = priceRange
        // this.gridSize = gridSize
        this.gridPrice = priceRange / gridSize
        this.unitAmount = baseStock / gridSize

        this.exchange = exchange

        this.stock = baseStock
        this.lastTrade = null
        this.avgCost = basePrice
        this.profit = 0

        util.log(`basePrice: ${this.basePrice}, baseStock: ${this.stock}, gridPrice: ${this.gridPrice}, unitAmount: ${this.unitAmount}`)
    }

    async doTrade() {
        let price = this.exchange.price
        let grid = this.getGrid(price)
        let orderAmount = this.getOrderAmount(grid)
        if(orderAmount !== 0) {
            this.handleResult(grid, await this.trade(orderAmount))
        }
    }

    handleResult(grid, result) {
        if(!result) return
        if(result.completed) {
            this._recordTrade(result.amount, result.dealAmount, Math.abs(result.balanceChanged/result.dealAmount), grid)
        }else {
            this.setPendingOrderUpdate()
        }
    }

    setPendingOrderUpdate() {
        this.exchange.once('lastOrderAmount', (amount) => {

        })
    }

    getGrid(price) {
        let grid = (price - this.basePrice) / this.gridPrice
        grid = grid >= 0? _.floor(grid): _.ceil(grid)
        // util.log(`Price: ${price}, grid: ${grid}`)
        return grid
    }

    getOrderAmount(grid) {
        if(grid == 0 && this.lastTrade == null) {
            return 0
        }

        let gridChanged = this._getGridChanged(grid)

        // util.log(`gridChanged: ${gridChanged}`)

        let orderAmount = 0, type = 'buy'

        if(gridChanged === 0) {
            orderAmount = Math.max(this.unitAmount - Math.abs(this.lastTrade.amount), 0)
            type = this.lastTrade.amount > 0? 'buy': 'sell'
        }else {
            orderAmount = this.unitAmount * Math.abs(gridChanged)
            type = gridChanged > 0? 'sell': 'buy'
        }

        if(type === 'buy') {
            return Math.min(orderAmount, this.exchange.sell1Amount, this.exchange.amountCanBuy)
        }else {
            return Math.min(orderAmount, this.exchange.buy1Amount, this.exchange.amountCanSell) * -1
        }
    }

    async trade(amount) {
        if(amount > 0 && this.exchange.canBuySuch(amount)) {
            this.printStarter()
            return await this.exchange.limitBuy(amount)
        }else if(amount < 0 && this.getTradePrice(amount) > this.avgCost && this.exchange.canSellSuch(Math.abs(amount))) {
            this.printStarter()
            return await this.exchange.limitSell(Math.abs(amount))
        }
        return null
    }

    getTradePrice(tradeAmount) {
        return tradeAmount > 0? this.exchange.payForBuyOne: this.exchange.earnForSellOne
    }

    _recordTrade(orderAmount, dealAmount, price, grid) {
        if(dealAmount === 0) return

        this.lastTrade = {
            amount: this._getGridChanged(grid) === 0? dealAmount + this.lastTrade.amount: dealAmount,
            grid: grid
        }

        if(dealAmount > 0) {
            this.avgCost = (this.stock * this.avgCost + price * dealAmount) / (this.stock + dealAmount)
        }

        if(dealAmount < 0) {
            this.profit += (price - this.avgCost) * Math.abs(dealAmount)
        }

        this.stock += dealAmount

        this.printLog(price, grid, orderAmount, dealAmount)
    }

    printLog(price, grid, orderAmount, dealAmount) {
        util.log(`price: ${price}, grid: ${grid}, orderAmount: ${orderAmount}, dealAmount: ${dealAmount}`)
        if(dealAmount > 0) {
            util.log.green(`buy: ${dealAmount}`)
        }else {
            util.log.blue(`sell: ${dealAmount}`)
        }
        util.log(`this.avgCost: ${this.avgCost}, profit: ${this.profit}, stocks: ${this.stock}`)
    }

    printStarter() {
        util.log('------------------------')
    }

    _getGridChanged(grid) {
        let lastGrid = this.lastTrade == null? 0: this.lastTrade.grid
        return grid - lastGrid
    }
}

module.exports = Grid