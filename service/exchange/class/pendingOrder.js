const util = require ('../../../util/util')

class PendingOrder {
    constructor(symbol, beforeAccount, orderAmount, hasPendingOrders) {
        this.symbol = symbol
        this.beforeAccount = beforeAccount
        this.orderAmount = orderAmount
        this.hasPendingOrders = hasPendingOrders
    }

    updatePendingOrder(hasPendingOrders) {
        util.log.blue(`this.hasPendingOrders: ${this.hasPendingOrders}, hasPendingOrders: ${hasPendingOrders}`)
        this.hasPendingOrders = this.hasPendingOrders || hasPendingOrders
    }
}

module.exports = PendingOrder