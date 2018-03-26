const util = require ('../util/util.js')
const _ = require('lodash')
const BaseStrategy = require('./baseStrategy.js')
const Grid = require('./grid')


const config = {
    gridSize: 5,
    // gridSize: 0.005,
    orderAmount: 0.2,
    stopRate: 0.92
}

class GridTrade extends BaseStrategy {
    before() {
        this.totalProfit = 0
        this.exchange = this.allExchanges['bittrex']
        let basePrice = this.getConfig('basePrice')
        this.grid = new Grid(9000, this.exchange.stocks, 1000, 10, this.exchange)
    }

    async doTrade() {
        if(!this.canTrade()) return
        await this.grid.doTrade()
    }

    canTrade() {
        return true
    }
}

module.exports = GridTrade
