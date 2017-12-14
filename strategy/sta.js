const util = require ('../util/util.js')
const Strategy = require('./baseStrategy.js')
const database = require('../service/database.js')
const _ = require('lodash')
const math = require('mathjs')

class Sta extends Strategy {

    before() {
        this.data = {}
    }

    setData(e1, e2) {
        var posDiff = e1.earnForSellOne - e2.payForBuyOne
        var negDiff = e2.earnForSellOne - e1.payForBuyOne

        var key = `${e1.id}-${e2.id}`

        if(!this.data[key]) {
            this.data[key] = {
                posDiff: [],
                negDiff: []
            }
        }else {
            this.data[key].posDiff.push(posDiff)
            this.data[key].negDiff.push(negDiff)
        }
    }

    after() {
        var that = this
        var result = {}
        _.forEach(this.data, function (value, key) {
            result[key] = {
                posAvg: math.mean(value.posDiff),
                posStd: math.std(value.posDiff),
                negAvg: math.mean(value.negDiff),
                negStd: math.std(value.negDiff),
            }
        })
        util.log(JSON.stringify(result))
    }

    print(name, diff, result) {
        this.log(`${name} "总数:" ${diff.length}, "方差:" ${math.std(diff)}, "平均:" ${math.mean(diff)}, "最大:" ${math.max(diff)}, "最小:" ${math.min(diff)}`)

    }
    
	async doTrade(time) {
        var list = _.values(this.exchanges)

        for(var i=0; i<list.length; i++) {
            for(var j=i+1; j<list.length; j++) {
                this.setData(list[i], list[j])
            }
        }
	}
}
module.exports = Sta