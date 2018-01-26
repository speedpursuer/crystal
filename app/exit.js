const util = require ('../util/util.js')
const _ = require('lodash')
const Exchange = require('../service/exchange/exchange.js')

class Exit {
    constructor(exchangeIDs, cryptos) {
        // this.exchangeIDs = exchangeIDs
        // this.cryptos = cryptos

        this.exchanges = []
        for(var id of exchangeIDs) {
            for(var crypto of cryptos) {
                this.exchanges.push(new Exchange(id, crypto, "USD", 0, 0, true))
            }
        }
    }

    doExit() {
        for(var exchange of this.exchanges) {

        }
    }
}
module.exports = Exit