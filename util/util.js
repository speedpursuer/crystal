const Promise = require('bluebird');
const log = require ('ololog').configure ({ locate: false, time: true })

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

	getExRate(fiat) {
		var fiats = {
			"USD": 6.5807,
			"USDT": 6.5807,
			"JPY": 0.0585,
			"EUR": 7.7678,
			"WUSD": 6.5807,
		}
		return fiats[fiat.toUpperCase()]
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