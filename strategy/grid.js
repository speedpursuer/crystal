const util = require ('../util/util.js')
const _ = require('lodash')

const maxAmountOnce = 0.1

class Grid {
    constructor(basePrice, baseStock, priceRange, gridSize, exchange) {
        this.basePrice = basePrice
        // this.priceRange = priceRange
        // this.gridSize = gridSize
        this.gridPrice = priceRange / gridSize
        this.unitAmount = baseStock / gridSize

        this.exchange = exchange

        this.stock = baseStock
        this.avgCost = basePrice
        this.profit = 0

        this.lastTrade = null
        this.isWorking = true
        this.currGrid = 0

        util.log(`basePrice: ${this.basePrice}, baseStock: ${this.stock}, gridPrice: ${this.gridPrice}, unitAmount: ${this.unitAmount}`)
    }

    canTrade() {
        return this.isWorking
    }

    async _doTrade() {
        let price = this.exchange.price
        let grid = this.getGrid(price)
        let orderAmount = this.getOrderAmount(grid)
        if(orderAmount !== 0) {
            // util.log(`Real price: ${price}, buyPrice: ${this.exchange.buyPrice}, sellPrice: ${this.exchange.sellPrice}`)
            this.handleResult(grid, await this.trade(orderAmount))
        }
    }

    async doTrade() {

        // let sell = this.calcOrderAmount(this.exchange.sellPrice)
        // let buy = this.calcOrderAmount(this.exchange.buyPrice)
        //
        // if(sell.orderAmount !== 0) {
        //     this.handleResult(sell.grid, await this.trade(sell.orderAmount))
        // }else if(buy.orderAmount !== 0) {
        //     this.handleResult(buy.grid, await this.trade(buy.orderAmount))
        // }


        // if(await this.didBuy(this.exchange.buyPrice)) {
        //
        // }else if(await this.didSell(this.exchange.sellPrice)) {
        //
        // }

        if(await this.didSell(this.exchange.sellPrice)) {

        }else if(await this.didBuy(this.exchange.buyPrice)) {

        }
    }

    async didBuy(buyPrice) {
        let buy = this.calcOrderAmount(buyPrice)
        if(buy.orderAmount > 0 && this.exchange.canBuySuch(buy.orderAmount)) {
            this.printStarter()
            util.log.blue(`BuyPrice: ${buyPrice}`)
            this.handleResult(buy.grid, await this.exchange.limitBuy(buy.orderAmount))
            return true
        }
        return false
    }

    async didSell(sellPrice) {
        let sell = this.calcOrderAmount(sellPrice)
        if(sell.orderAmount < 0 && this.getTradePrice(sell.orderAmount) > this.avgCost && this.exchange.canSellSuch(Math.abs(sell.orderAmount))) {
            this.printStarter()
            util.log.green(`SellPrice: ${sellPrice}`)
            this.handleResult(sell.grid, await this.exchange.limitSell(Math.abs(sell.orderAmount)))
            return true
        }
        return false
    }

    calcOrderAmount(price) {
        let grid = this.getGrid(price)
        let orderAmount = this.getOrderAmount(grid)
        return {grid, orderAmount}
    }

    gridGap() {
        return this.currGrid
    }

    handleResult(grid, result) {
        if(!result) return

        this.isWorking = result.completed

        if(result.completed) {
            this._recordTrade(result.amount, result.dealAmount, Math.abs(result.balanceChanged/result.dealAmount), grid)
        }else {
            this.setPendingOrderUpdate()
        }
    }

    setPendingOrderUpdate() {
        let that = this
        this.exchange.once('lastOrderResult', (result) => {
            that.handleResult(that.currGrid, result)
        })
    }

    getGrid(price) {
        let grid = (price - this.basePrice) / this.gridPrice
        grid = grid >= 0? _.floor(grid): _.ceil(grid)
        this.setCurrrentGrid(grid)
        // util.log(`Price: ${price}, grid: ${grid}`)
        return grid
    }

    setCurrrentGrid(grid) {
        this.currGrid = grid
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