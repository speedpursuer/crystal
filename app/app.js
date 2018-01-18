const util = require('../util/util.js')
const Trade = require('../service/trade.js')

async function main() {
    try {
        var trade = new Trade(util.getParameter())
        trade.run().then()
    }catch (e) {
        util.log.bright.yellow(e)
        process.exit()
    }
}

main()