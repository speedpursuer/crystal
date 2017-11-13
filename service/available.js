const util = require('../util/util.js')

const maxFailureTimes = 2
const retryInterval = 5 * 1000 //* 60 

class Available {
	constructor(checkMethod) {
		this.isAvailable = true
		this.failureTimes = 0
		this.checkMethod = checkMethod
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
}
module.exports = Available