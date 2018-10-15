const util = require ('../util/util.js')
const _ = require('lodash')
const BaseStrategy = require('./baseStrategy.js')
const Grid = require('./grid')

const config = {
    basePrice: 7000,
    baseStock: 3,
    baseBalance: 21000,
    priceRange: 1000,
    gridSize: 50
}

class GridTrade extends BaseStrategy {
    before() {
        // this.totalProfit = 0
        // let basePrice = this.getConfig('basePrice')

        this.exchange = this.getExhange()

        this.minStock = this.exchange.stocks - config.baseStock
        this.minBalance = this.exchange.balance - config.baseBalance
        this.topPrice = config.basePrice + config.priceRange
        this.bottomPrice = config.basePrice - config.priceRange

        this.grid = new Grid(config.basePrice, config.baseStock, config.priceRange, config.gridSize, this.exchange)

        util.log.green(`策略配置: minStock: ${this.minStock}, minBalance: ${this.minBalance}, topPrice: ${this.topPrice}, bottomPrice: ${this.bottomPrice}, exchange: ${this.exchange}`)
        util.log.blue(`当前币值: ${this.exchange.stocks}, 余额: ${this.exchange.balance}, 价格: ${this.exchange.price}`)
    }

    async doTrade() {
        await this.grid.doTrade()
    }

    canTrade() {
        if(!super.canTrade()) {
            return false
        }

        if(!this.grid.canTrade()) {
            return false
        }

        if(this.exchange.stocks <= this.minStock) {
            util.log.red(`当前币值 ${this.exchange.stocks} 小于最小币值: ${this.minStock}`)
            return false
        }

        if(this.exchange.balance <= this.minBalance) {
            util.log.red(`当前余额 ${this.exchange.balance} 小于最小余额: ${this.minBalance}`)
            return false
        }

        if(this.price >= this.topPrice) {
            util.log.red(`当前价格: ${this.price} 大于上限 ${this.topPrice}`)
            return false
        }

        if(this.price <= this.bottomPrice) {
            util.log.red(`当前价格: ${this.price} 小于下限 ${this.bottomPrice}`)
            return false
        }

        return true
    }

    get currProfit() {
        return this.grid.profit
    }

    getExhange() {
        for(let key in this.allExchanges) {
            return this.allExchanges[key]
        }
    }
}

module.exports = GridTrade
