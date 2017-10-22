// var Promise = require('bluebird');
// var promiseWhile = function(condition, action) {
//     var resolver = Promise.defer();

//     var loop = function() {
//         if (!condition()) return resolver.resolve();
//         return Promise.cast(action())
//             .then(loop)
//             .catch(resolver.reject);
//     };

//     process.nextTick(loop);

//     return resolver.promise;
// };

const util = require ('../util/util.js')
var assert = require('assert');
var _ = require('lodash/core');
const keys = require('../config/exchangeInfo.js')

// describe('Array', function() {
//   describe('#indexOf()', function() {
//     it('should return -1 when the value is not present', function() {
//       assert.equal(-1, [1,2,3].indexOf(4));
//     });
//   });
// });



class Test {
	async run() {
		return util.sleep(100)
		util.log("after await")
	}
}

async function test() {
	var test = new Test()
	await test.run()
	.then(function(){
		util.log("1")
	})
	.then(function(){
		util.log("2")
	})
	util.log("after run")
	util.log("class name", test.constructor.name)
}


function test1() {
	change(5005)
	function change(price) {
		// x = adjustFloat(x + 10)
		price = adjustFloat(price + getRandomArbitrary(-1, 0))
		util.log(price)
	}
	function adjustFloat(v) {                 // 处理数据的自定义函数 ，可以把参数 v 处理 返回 保留3位小数（floor向下取整）
	    return Math.floor(v*1000)/1000;       // 先乘1000 让小数位向左移动三位，向下取整 整数，舍去所有小数部分，再除以1000 ， 小数点向右移动三位，即保留三位小数。
	}
	function getRandomArbitrary (min, max) {
        return Math.random() * (max - min) + min;
    }
}

function test2() {
	function toFixedNumber(number, x, base){
	  	var pow = Math.pow(base||10,x);
	  	util.log.red(pow)
	  	return +( Math.round(number*pow) / pow );
	}

	util.log(toFixedNumber(5000.2345, 5))
}

function test3() {
	var orderBooks = { 
		'bids': [
			[120, 0.5],
			[121, 0.6]
		],
		'asks': [
			[119, 0.1],
			[118, 0.2]
		]
	};

	orderBooks = {
		'bids': [
			[120, 0.5],
			[121, 0.6]
		]
	}
	var value = util.deepGet(orderBooks, 'asks.1.0')
    var result = value === undefined? 0: value
    util.log(result)
}

function test4() {
	var a = ['a', 'b']
	var b
	util.log(a.includes('c'))
	util.log(!isNaN(b))

	var ORDER_TYPE_BUY = 'a'
	var ORDER_TYPE_SELL = 'b'
	var type

	util.log([ORDER_TYPE_BUY, ORDER_TYPE_SELL].includes(type))
}

function test5(){
	util.log(util.getExRate('jpy'))
}

function test6() {
	var order = {status: 'close'}
	util.log(['live', 'open'].includes(order.status))
}

async function test7() {

	async function f1() {
		// return util.sleep(1000)
		// .then(function(){
		// 	return 1
		// })
		util.log("1.1")
		await util.sleep(1000)
		util.log("1.2")
		await util.sleep(5000)
		util.log("1.3")
		return 1
	}

	async function f2() {
		util.log("2.1")
		await util.sleep(2000)
		util.log("2.2")
		for(var i=0;i<20;i++) {
			util.log(i)
		}
		return 2
	}

	util.log(await Promise.all([f1(), f2()]))
}

async function test8() {
	async function f1() {
		util.log("1 start")
		var i = 0
		while(true) {
			// util.log("1.1")
			await util.sleep(200)
			util.log("1 roop: ", i)
			i++
			if(i == 10) break
		}		
		util.log("1 end")	
		return 1	
	}

	async function f2() {
		util.log("2 start")
		var i = 0
		while(true) {			
			await util.sleep(100)
			util.log("2 roop: ", i)
			i++
			if(i == 20) break
		}				

		util.log("2 end")		
		return 2
	}

	util.log(await Promise.all([f1(), f2()]))
}

function test9() {
	util.log(keys['kraken'])
}

function test10() {

	class A{
		constructor() {
			this.x = 1
			this.y = 2
		}

		do() {
			var a = {
				x: this.x,
				y: this.y
			}
			util.log(a)
		}
	}

	var a = new A()
	a.do()
}


test10()