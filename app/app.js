const util = require('../util/util.js')
const Trade = require('../service/trade/trade.js')

async function main() {
    try {
        var trade = new Trade(util.getParameter(), true, true)
        trade.run().then()
    }catch (e) {
        util.log.bright.yellow(e)
        process.exit()
    }
}

main()