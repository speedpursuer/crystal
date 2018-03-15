const util = require ('../util/util.js')
const _ = require('lodash')
const BaseStrategy = require('./baseStrategy.js')


const config = {
    gridSize: 5,
    // gridSize: 0.005,
    orderAmount: 0.2,
    stopRate: 0.92
}

class GridTrade extends BaseStrategy {
    before() {
        // TODO check if there is only one exchange
    }

    async doTrade() {
        //
    }
}

module.exports = GridTrade
