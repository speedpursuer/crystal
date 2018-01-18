const OrderbookStream =require('./baseOrderbook')
const util = require('../../util/util')
const _ = require('lodash')
const rp = require('request-promise')

class OrderBookStreamBinance extends OrderbookStream {

    init(symbols) {
        super.init(symbols)
        // this.streamMgrs = {}
        for(let symbol of symbols) {
            this.url += `${this.realSymbol(symbol)}@depth10/`
            // let realSymbol = this.realSymbol(symbol)
            // this.streamMgrs[realSymbol] = new StreamMgr(realSymbol)
        }
    }

    handleMessage(msg) {
        this.orderbooks[this.getSymbol(msg)] = msg.data
        // this.streamMgrs[this.getSymbol(msg)].handleStream(msg.data)
    }

    getSymbol(msg) {
        return msg.stream.split('@')[0]
    }
}

// class StreamMgr {
//     constructor(symbol) {
//         this.symbol = symbol
//         this.streamCache = []
//         this.bids = {}
//         this.asks = {}
//         this.matchup = false
//     }
//
//     handleStream(data) {
//         this.testData(data)
//         if(this.streamCache.length === 0) {
//             this.getSnapshoot().then()
//         }
//         if(!this.matchup) {
//             this.streamCache.push(data)
//         }
//     }
//
//     testData(data) {
//         this.test(data, 'bids')
//         this.test(data, 'asks')
//     }
//
//     test(data, side) {
//         util.log.yellow(`${side} - count: ${data[side].length}`)
//         for(let item of data[side]) {
//             util.log(`${side} - Price: ${item[0]}, Amount: ${item[1]}`)
//             if(item[1] == 0) {
//                 util.log.red("Found!!")
//             }
//         }
//     }
//
//     async getSnapshoot() {
//         let result = await rp(`https://www.binance.com/api/v1/depth?symbol=${_.toUpper(this.symbol)}&limit=10`)
//         let snapshoot = JSON.parse(result)
//         let firstUpdateId = snapshoot.lastUpdateId
//         while(!this.matchup) {
//             for (let data of this.streamCache) {
//                 util.log(`data.lastUpdateId: ${data.lastUpdateId}, this.firstUpdateId: ${firstUpdateId}`)
//                 if(data.lastUpdateId >= firstUpdateId) {
//                     util.log("Got it")
//                     this.matchup = true
//                 }
//             }
//             await util.sleep(1000)
//         }
//     }
// }

module.exports = OrderBookStreamBinance
