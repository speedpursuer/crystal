const Counter = require('./counter')
const EventEmitter = require('events')


class Available extends EventEmitter {
	constructor(failureInterval, failureThreshold, retryDelay, retryInterval, retryThreshold) {
	    super()
		this.isAvailable = true
        this.closed = false
        this.counter = new Counter(failureInterval, failureThreshold)
        this.retryCounter = new Counter(retryInterval, retryThreshold)
        this.retryDelay = retryDelay
	}

    reportIssue(isFatal=false) {
	    if(isFatal) {
	        this._reportFatal()
        }else {
	        this._reportIssue()
        }
    }

    reportCheck(fixed) {
        if(fixed) {
            this.isAvailable = true
            this.counter.reset()
        }else {
            this.isAvailable = false
            this.counter.directCount()
            //给API失败情况无限的重试机会
            this.retryCounter.reset()
            this._checkLater()
        }
    }

	_reportIssue() {
	    if(!this.isAvailable) return
        if(this.counter.isOverCountAfterCount){
            this.isAvailable = false
            this._checkLater()
        }
	}

	_reportFatal() {
        if(!this.isAvailable) return
        this.isAvailable = false
        this.counter.countToThreshold()
        this._checkLater()
    }

    _checkLater() {
        if(this.retryCounter.isOverCountAfterCount) {
            this.closed = true
            this.emit("closed")
        }else {
            var that = this
            setTimeout(function(){
                that.emit("check")
            }, this.retryDelay * this.counter.overCount)
        }
    }
}
module.exports = Available