const util = require('../../util/util.js')
const EventEmitter = require('events')

const failureInterval = 1000 * 60
const maxFailureTimes = 3
const retryInterval = 3000 * 60

class Available extends EventEmitter {
	constructor() {
	    super()
		this.isAvailable = true
		this.failureTimes = 0
		this.lastFailureTime = util.timestamp
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
            this.failureTimes = 0
        }else {
            this.isAvailable = false
            this.failureTimes++
            this._checkLater()
        }
    }

	_reportIssue() {
	    if(!this.isAvailable) return
        if(util.timestamp - this.lastFailureTime < failureInterval) {
            this.failureTimes++
            if(this.failureTimes > maxFailureTimes) {
                this.isAvailable = false
                this._checkLater()
            }
        }else {
            this.failureTimes = 1
            this.lastFailureTime = util.timestamp
        }
	}

	_reportFatal() {
        if(!this.isAvailable) return
        this.isAvailable = false
	    this.failureTimes = Math.max(this.failureTimes, maxFailureTimes) + 1
        this._checkLater()
    }

    _checkLater() {
        var that = this
        setTimeout(function(){
            that.emit("check")
        }, retryInterval * (this.failureTimes - maxFailureTimes))
    }
}
module.exports = Available