const util = require('./util.js')

class Counter {
    constructor(interval, threshold) {
        this.interval = interval
        this.threshold = threshold
        this.reset()
    }

    count() {
        if(util.timestamp - this.initTime < this.interval) {
            this._count()
        }else {
            this.reset()
            this.directCount()
        }
    }

    get isOverCountAfterCount() {
        this.count()
        return this.isOverCount
    }

    get overCount() {
        return Math.max(this.curCount - this.threshold, 0)
    }

    directCount() {
        this.curCount++
        this._checkOverCount()
    }

    countToThreshold() {
        this.curCount = Math.max(this.curCount, this.threshold) + 1
    }

    reset() {
        this.curCount = 0
        this.initTime = util.timestamp
        this.isOverCount = false
    }

    _count() {
        this.directCount()
        this._checkOverCount()
    }

    _checkOverCount() {
        if(this.overCount > 0) {
            this.isOverCount = true
        }
    }
}
module.exports = Counter