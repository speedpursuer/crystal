const Counter = require('./counter')
const EventEmitter = require('events')


class Available extends EventEmitter {
	constructor(failureInterval, maxFailureTimes, retryInterval) {
	    super()
		this.isAvailable = true
        this.counter = new Counter(failureInterval, maxFailureTimes)
        this.retryInterval = retryInterval
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
            this._checkLater()
        }
    }

	_reportIssue() {
	    if(!this.isAvailable) return
        this.counter.count()
        if(this.counter.isOverCount){
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
        var that = this
        setTimeout(function(){
            that.emit("check")
        }, this.retryInterval * this.counter.overCount)
    }
}
module.exports = Available