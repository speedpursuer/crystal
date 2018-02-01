const util = require('../util/util.js')
const TradeAll = require('../service/trade/tradeAll')

function main() {
    try {
        var trade = new TradeAll(util.getParameter(false))
        trade.init().then()
    }catch (e) {
        util.log.bright.yellow(e)
        process.exit()
    }
}

main()