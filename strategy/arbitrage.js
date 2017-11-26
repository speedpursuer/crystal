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

        if(_.size(this.exchanges) != 2) return

        var list = _.values(this.exchanges)

        var posDiff = list[0].earnForSellOne - list[1].payForBuyOne
        var negDiff = list[1].earnForSellOne - list[0].payForBuyOne

        this.posDiff.push(posDiff)
        this.negDiff.push(negDiff)
	}
}
module.exports = Arbitrage