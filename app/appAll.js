const util = require('../util/util.js')
const Trade = require('../service/trade/tradeAll.js')
const TradeAll = require('../service/all/tradeAll')

function main() {
    try {
        var trade = new TradeAll()
        trade.init().then()
    }catch (e) {
        util.log.bright.yellow(e)
        process.exit()
    }
}

main()