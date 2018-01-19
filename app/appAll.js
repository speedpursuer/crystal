const util = require('../util/util.js')
const Trade = require('../service/tradeAll.js')

async function main() {
    try {
        var trade = new Trade()
        trade.run().then()
    }catch (e) {
        util.log.bright.yellow(e)
        process.exit()
    }
}

main()