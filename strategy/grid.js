const util = require ('../util/util.js')
const _ = require('lodash')

class Grid {
    constructor(basePrice, baseStock, priceRange, gridSize, exchange) {
        this.basePrice = basePrice
        this.priceRange = priceRange
        this.gridSize = gridSize
        this.gridPrice = priceRange / gridSize
        this.unitAmount = baseStock / gridSize
        this.exchange = exchange

        this.stock = baseStock
        this.lastTrade = null
        this.avgCost = basePrice
        this.profit = 0
    }

    async doTrade() {
        let price = this.exchange.price
        let grid = this.getGrid(price)
        let orderAmount = this.getOrderAmount(grid)
        if(orderAmount === 0) {
            return
        }
        // price = this.correctedPrice(orderAmount)
        await this.trade(orderAmount, price)
        this.recordTrade(orderAmount, price, grid)
    }

    correctedPrice(amount) {
        return amount > 0? this.exchange.sellPrice: this.exchange.buyPrice
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

        // let lastGrid = this.lastTrade == null? 0: this.getGrid(this.lastTrade.price)
        let gridChanged = this._getGridChanged(grid)

        let orderAmount

        if(gridChanged === 0) {
            if(this.lastTrade.amount > 0) {
                let amount = this.unitAmount - this.lastTrade.amount
                orderAmount = amount > 0? amount: 0
            }else {
                let amount = this.unitAmount + this.lastTrade.amount
                orderAmount = amount > 0? -1 * amount: 0
            }
        }else {
            orderAmount = -1 * gridChanged * this.unitAmount
        }
        // else if(gridChanged > 0) {
        //     return -1 * Math.min(gridChanged * this.unitAmount, this.exchange.buy1Amount)
        // }else {
        //     return -1 * Math.max(gridChanged * this.unitAmount, -1 * this.exchange.sell1Amount)
        // }

        if(orderAmount > 0) {
            return Math.min(orderAmount, this.exchange.sell1Amount)
        }else {
            return Math.max(orderAmount, -1 * this.exchange.buy1Amount)
        }
    }

    async trade(amount, price) {
        if(amount === 0) {
            return
        }else if(amount > 0) {
            return await this.exchange.limitBuy(amount)
        }else if(price > this.avgCost){
            return await this.exchange.limitSell(-1 * amount)
        }else {
            return
        }
    }

    recordTrade(amount, price, grid) {
        if(amount === 0) return

        if(this._getGridChanged(grid) === 0) {
            amount += this.lastTrade.amount
        }
        this.lastTrade = {
            amount, grid
        }

        if(amount > 0) {
            this.avgCost = (this.stock * this.avgCost + price * amount) / this.stock + amount
        }

        if(amount < 0) {
            this.profit -= (price - this.avgCost) * amount
        }

        this.stock += amount

        util.log(`this.avgCost: ${this.avgCost}, this.profit: ${this.profit}`)
    }

    _getGridChanged(grid) {
        let lastGrid = this.lastTrade == null? 0: this.lastTrade.grid
        return grid - lastGrid
    }
}

module.exports = Grid