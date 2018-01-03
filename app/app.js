const util = require('../util/util.js')
const Trade = require('../service/trade.js')

function getTradeName() {
    if (process.argv.length == 3){
        return process.argv.slice(2)
    }else {
        throw 'No function name provided'
    }
}

async function main() {
    try {
        var trade = new Trade(getTradeName())
        trade.run()
    }catch (e) {
        util.log.bright.yellow(e)
        process.exit()
    }
}

main()