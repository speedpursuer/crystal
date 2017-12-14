const Promise = require('bluebird');
const log = require ('ololog').configure ({ locate: false, time: true })
const moment = require('moment')
// const exchangeInfo = require('../config/exchangeInfo.js')
const exchangeInfo = require('../config/exchangeInfo_bch.js')
// const exchangeInfo = require('../config/exchangeInfo_eth.js')

class Util{
	sleep(ms) {
		return new Promise (resolve => setTimeout (resolve, ms))
	}

	async promiseFor(list, method) {
		var fetchers = []
		for(var i in list) {
			if(typeof list[i][method] === "function") {
				fetchers.push(list[i][method]())
			}            
        }
        return await Promise.all(fetchers)    
	}

	get log() {
		return log
	}

	get now() {
        return moment().format("YYYY-MM-DD HH:mm:ss")
    }

    get time() {
        return (new Date()).getTime()
    }

    get timestamp() {
        return moment().unix() * 1000
    }
    
    timestampFromTime(time) {
    	return moment(time).unix() * 1000
    }

    timeFromTimestamp(timestamp) {
    	return moment.unix(timestamp/1000).format("YYYY-MM-DD HH:mm:ss")
    }

	toFixedNumber(number, x, base=10){
	  	var pow = Math.pow(base||10,x);
	  	return +( Math.round(number*pow) / pow );
	}

	deepGet(obj, path) {		
		return doIt(obj, path.split("."))

		function doIt(obj, properties) {
			// If we have reached an undefined/null property
		    // then stop executing and return undefined.
		    if (obj === undefined || obj === null) {
		        return;
		    }

		    // If the path array has no more elements, we've reached
		    // the intended property and return its value.
		    if (properties.length === 0) {
		        return obj;
		    }

		    // Prepare our found property and path array for recursion
		    var foundSoFar = obj[properties[0]];
		    var remainingProperties = properties.slice(1);

		    return doIt(foundSoFar, remainingProperties);
		}    
	}

	getExchangeInfo(id) {
		var id = id.toLowerCase()
        var info = exchangeInfo[id]
        info.id = id
        return info
	}

	getExRate(fiat) {
		var fiats = {
			"USD": 6.64,
			"USDT": 6.64,
			"JPY": 0.0585,
			"EUR": 7.7678,
			"WUSD": 6.64,
			"BTC": 43800
		}
		return fiats[fiat.toUpperCase()]
	}

	promiseWithTimeout(aPromise, timeout) {
		return Promise.race([
			aPromise(),
		    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))		  
		])
	}

	promiseWhile(condition, action) {
	    var resolver = Promise.defer();
	    var self = this
	    var maxRetry = 5
	    var retried = 0
	    var loop = function() {
	        if (retried > maxRetry|| !condition()) return resolver.resolve();
	        return Promise.cast(action())
	            .then(()=>{
	            	retried++
	            	self.sleep(200)
	            })
	            .then(loop)
	            .catch(resolver.reject);
	    };

	    process.nextTick(loop);

	    return resolver.promise;
	}
}
var util = new Util()
module.exports = util