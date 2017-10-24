const util = require ('../util/util.js')
var assert = require('assert')
// var _ = require('lodash/core');
const keys = require('../config/exchangeInfo.js')
const _ = require('lodash')


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

async function test11() {
	async function doSome() {
		util.log("before sleep")
		await util.sleep(2000)	
		util.log("after sleep")
	}

	function b() {
		var a = doSome()
		util.log(a)
		return a
	}
	await b()
	util.log("after b()")
}

function test12() {
	// var users = [
 //  		{ 'user': 'barney', 'age': 36, 'active': true },
 //  		{ 'user': 'fred',   'age': 40, 'active': false }
	// ];
	// var users = {
	// 	"a": { 'user': 'barney', 'age': 36, 'active': true },
	// 	"b": { 'user': 'fred',   'age': 40, 'active': false }
	// }

	var list = [ 
		{    
			id:  1,
    		amount:  12,
     		price:  2999.027,
    		status: "open",
      		type: "buy"      
      	} 
    ]
 
	var result = _.filter(list, function(o) { return o.status == 'open' });
	util.log(list)
	util.log(result)
	// util.log(_.values(result))
}

async function test13() {
	function do1 () {
		return util.sleep(100)
	}

	async function do2() {
		throw "err"
	}

	function do3() {
		return do1()
		.then(function (){
			util.log('do3')
			return do2()			
		})
		// .catch(function(e){
		// 	util.log(e, 'do3')
		// })
		// .finally(function(){
		// 	util.log('do3 finally')
		// })
	}

	async function do4() {
		try{
			await do1()
			await do2()
			util.log('do4')
		}catch(e) {
			util.log(e, 'do4')
			throw e			
		}finally {
			util.log('do4 finally')
		}		
	}

	async function do5() {
		await do1()
		await do2()
		util.log('do4')		
	}

	function do6() {
		var a = null
		util.log(a.b)
	}

	function do7() {
		do6()
	}

	async function do8() {
		await util.sleep(400)
		return ['a']
	}

	async function do9() {
		return await do8()
	}

	try{
		util.log(await do9())
	}catch(e){
		util.log('catch')
		// util.log(e)
	}
}

function test14() {
	var list = {
		a: {
			price: 12
		},
		b: {
			price: 34
		},
		c: {
			price: 6
		}
	}
	var result = _.orderBy(list, 'price', 'asc')
	util.log(list)
	util.log(result)
} 

async function test15() {
	class A{
		async balanced() {
			await util.sleep(100)
			return false
		}
	}

	var a = new A()
	util.log(await a.balanced())
}

function test16() {
	class A {
		constructor(amount, size) {
			this.amount = amount
			this.size = size
		}

		get total() {
			return this.amount * this.size			
		}
	}

	var list = [new A(3, 11), new A(1, 20), new A(2, 15)]

	var result = _.orderBy(list, 'total', 'desc')

	util.log(result)
}

function test17() {
	global.simMode = true
	util.log(_.round(1213.004, 2))
	util.log(util.toFixedNumber(1213.004, 2))
	util.log(global.name)
}


if (require.main === module) {
  	// 如果是直接执行 main.js，则进入此处
  	// 如果 main.js 被其他文件 require，则此处不会执行。
  	test17()
}



