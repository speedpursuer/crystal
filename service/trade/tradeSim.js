const _ = require('lodash')
const Trade = require('./trade')

class TradeSim extends Trade{

    constructor(tradeName, exchangeAccount, debug=true){
        super(tradeName, debug)
        this.exchangeAccount = exchangeAccount
    }

    createExchanges() {
        let formattedAccount = {}
        this.exchangesIDs = []
        for(let key in this.exchangeAccount) {
            let newKey = key.toLowerCase()
            formattedAccount[newKey] = this.exchangeAccount[key]
            this.exchangesIDs.push(newKey)
        }
        this.exchanges = this.tradeBuilder.buildExchangesSim(formattedAccount)
    }
}
module.exports = TradeSim