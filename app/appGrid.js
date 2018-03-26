const util = require('../util/util.js')
const TradeSim = require('../service/trade/tradeSim.js')

function main() {
    try {
        let exchangeAccount = {
            'Bittrex': {
                base: 9,
                quote: 110000
            },
            // 'hitbtc': {
            //     base: 30,
            //     quote: 1
            // },
        }
        let trade = new TradeSim('grid', exchangeAccount)
        trade.run().then()
    }catch (e) {
        util.log.bright.yellow(e)
        process.exit()
    }
}

main()