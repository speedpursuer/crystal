const util = require ('../util/util.js')
const Strategy = require('./baseStrategy.js')
const _ = require('lodash')
const math = require('mathjs')

class Arbitrage extends Strategy {

    before() {
        this.posDiff = []
        this.negDiff = []
    }

    after() {
        this.print("Pos", this.posDiff)
        this.print("Neg", this.negDiff)

        this.log(`posGood: ${this.filter(this.posDiff).length}`)
        this.log(`negGood: ${this.filter(this.negDiff).length}`)
    }

    print(name, diff) {
        this.log(`${name} "总数:" ${diff.length}, "方差:" ${math.std(diff)}, "平均:" ${math.mean(diff)}, "最大:" ${math.max(diff)}, "最小:" ${math.min(diff)}`)
    }

    filter(diff) {
        return _.filter(diff, function(o) { return o > 0 })
    }
    
	async doTrade() {

        var posDiff = this.exchanges['bitfinex'].earnForSell - this.exchanges['okex'].payForBuy
        var negDiff = this.exchanges['okex'].earnForSell - this.exchanges['bitfinex'].payForBuy

        this.posDiff.push(posDiff)
        this.negDiff.push(negDiff)
	}
}
module.exports = Arbitrage