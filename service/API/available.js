const util = require('../util/util.js')
const EventEmitter = require('events')

const maxFailureTimes = 2
const retryInterval = 5 * 1000 //* 60 

class Available extends EventEmitter {
	constructor(checkMethod) {
		this._isAvailable = true
		this.failureTimes = 0
		this.checkMethod = checkMethod
	}

	set isAvailable(value) {
		this._isAvailable = value
		this._nofify(value)
	}

	get isAvailable() {
		return this._isAvailable
	}
	
	checkin(isSuccess, reset=false) {
		if(!this.isAvailable && !reset) return
		this.failureTimes = isSuccess? 0: this.failureTimes+1
		if(this.failureTimes > maxFailureTimes) {
			this.isAvailable = false
			var that = this
			setTimeout(function(){
				that.checkAvailable()
			}, retryInterval * (this.failureTimes - maxFailureTimes))	
		}
		if(reset && isSuccess) {
			this.isAvailable = true
		}
	}

	fatal() {
		this.failureTimes = maxFailureTimes
		this.checkin(false)
	}
	
	checkAvailable() {
		if(this.checkMethod()) {
			util.log("checkAvailable good")
			this.checkin(true, true)
		}else {
			util.log("checkAvailable bad")
			this.checkin(false, true)
		}
	}

	_nofify(flag) {
        this.emit(flag? 'open': 'close')   
    }
}
module.exports = Available