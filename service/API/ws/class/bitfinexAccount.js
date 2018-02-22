const _ = require('lodash')
const util = require('../../../../util/util')

const orderState = {
    ACTIVE: "ACTIVE",
    EXECUTED: "EXECUTED",
    PARTIALLY_FILLED: "PARTIALLY FILLED",
    CANCELED: "CANCELED"
}

class Account {
    constructor() {
        this.account = {}
        this.openOrders = []
    }

    getOpenOrdersBySymbol(symbol) {
        return _.filter(this.openOrders, function(o) { return o.symbol === symbol })
    }

    getAccount() {
        return this.account
    }

    isAccountReady() {
        return _.size(this.account) !== 0
    }

    handleOrderData(type, data) {
        if(type === 'os') {
            for(let order of data) {
                this._updateOpenOrder(order)
            }
        } else {
            this._updateOpenOrder(data)
        }
    }

    handleWalletData(type, data) {
        if(type === 'ws') {
            for(let wallet of data) {
                this._updateWallet(wallet)
            }
        } else {
            this._updateWallet(data)
        }
    }

    _getOrderState(stateString) {
        for (let key in orderState) {
            if (_.startsWith(stateString, orderState[key])) {
                return orderState[key]
            }
        }
    }

    _updateOpenOrder(orderData) {
        let order = {
            id: orderData[0],
            symbol: orderData[3],
            state: this._getOrderState(orderData[13])
        }

        _.remove(this.openOrders, function(item) {
            return item.id === order.id
        })

        // Remove canceled orders
        if(order.state !== orderState.CANCELED && order.state !== orderState.EXECUTED) {
            this.openOrders.push(order)
        }

        // util.log.green(this.openOrders)
    }

    _updateWallet(walletData) {
        let balanceType = 'exchange'
        let [ accountType, currency, total, interest, available ] = walletData
        if (accountType == balanceType) {
            if (currency[0] == 't')
                currency = currency.slice(1)
            let uppercase = currency.toUpperCase()
            uppercase = this._commonCurrencyCode(uppercase)
            let account = {}
            account['free'] = available? available: total
            account['total'] = total
            if (account['free'])
                account['used'] = account['total'] - account['free']
            this.account[uppercase] = account
        }
        // util.log.green(this.account)
    }

    _commonCurrencyCode (currency) {
        if (currency == 'DSH')
            return 'DASH'
        if (currency == 'QTM')
            return 'QTUM'
        if (currency == 'IOT')
            return 'IOTA'
        return currency
    }
}

module.exports = Account