const util = require ('../util/util.js')
var assert = require('assert')
// var _ = require('lodash/core');
const keys = require('../config/exchangeInfo.js')
const _ = require('lodash')

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const ccxt = require ('ccxt')

const moment = require('moment')

const math = require('mathjs')

var ProgressBar = require('progress')


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
	util.log(_.floor(1213.0144, 3))
	util.log(util.toFixedNumber(0.00965998123, 8))
	util.log(_.floor(0.00965998123, 8))
}

async function test18() {
	// mongoose.connect('mongodb://localhost/test');

	try {
		var db = mongoose.connect('mongodb://localhost/myapp', {
		  	useMongoClient: true,
		  	/* other options */
		})

		var kittySchema = mongoose.Schema({
		    name: String
		});

		// kittySchema.methods.speak = function () {
		//   var greeting = this.name
		//     ? "Meow name is " + this.name
		//     : "I don't have a name";
		//   console.log(greeting);
		// }

		var Kitten = mongoose.model('Kitten', kittySchema);

		var fluffy = new Kitten({ name: 'Jordan' });
		// fluffy.speak(); // "Meow name is fluffy"	

		await fluffy.save()

		// var result = await Kitten.findOne()
		// util.log(result)

		Kitten.find({}, function (err, docs) {
			for(var doc of docs) {
				util.log(doc.name)	
			}		  	
		});


	}catch(e){
		util.log.yellow(e)
	}


	// promise.then(function(db) {
	// 	db.on('error', console.error.bind(console, 'connection error:'));
	// 	db.once('open', function() {
	// 	  	util.log("we're connected!")
	// 	});
	// })
	// var db = mongoose.connection;
	// db.on('error', console.error.bind(console, 'connection error:'));
	// db.once('open', function() {
	//   	util.log("we're connected!")
	// });
}

async function test19() {
	let exchange = new ccxt.bitfinex()
	this.orderBooks = await exchange.fetchOrderBook('BTC/USD', {
        'limit_bids': 5, // max = 50
        'limit_asks': 5, // may be 0 in which case the array is empty
        'group': 1, // 1 = orders are grouped by price, 0 = orders are separate
        'depth': 5,
        'size': 5,            
    })
    
    util.log(this.orderBooks)
}

function test20() {
	util.log(_.slice([1,2,3,4,5], 0, 4))
}

async function test21() {
	util.log(util.timestamp)
	util.log(util.timeFromTimestamp(util.timestamp))
	var exchangeIDs = ['Bitfinex', 'Poloniex', 'Bittrex', 'Bitstamp', 'hitbtc']
	exchangeIDs = _.map(exchangeIDs, function(item) {return item.toLowerCase()})
	util.log(exchangeIDs)

	var start = util.timestamp
	await util.sleep(1200)
	util.log(util.timestamp - start)

	util.log(_.split('a', '/'))
}

async function test22() {
	var start = util.timestamp
	util.log(start)
	await util.sleep(1200)
	util.log(util.timestamp - start)
}

function test23(time) {
	util.log(moment("2017-11-01 09:14:59").unix())
	util.log(moment(time).unix())
	util.log(moment().unix())
	util.log(moment.unix("1509245091").format("YYYY-MM-DD HH:mm:ss"))

	util.log(math.std([2, 4, 6, 8]))
}

function test24() {
	var bar = new ProgressBar(':bar', { total: 10000, clear: true });
	// bar._destroy()
	util.log(bar)
	// for(var i=0; i<10000; i++) {
	// 	bar.tick()
	// }
	// var timer = setInterval(function () {
	//   bar.tick();
	//   if (bar.complete) {
	//     console.log('\ncomplete\n');
	//     clearInterval(timer);
	//   }
	// }, 100);
}

function test25() {
	var list = ['Bitfinex', 'Poloniex', 'Bittrex', 'hitbtc', 'okex', 'huobipro']

    for(var i=0; i<list.length; i++) {
    	// util.log("out", i)
        for(var j=i+1; j<list.length; j++) {
            // util.log("in", i)
            // util.log("in", j)
            util.log(list[i], list[j])
        }
    }
}

function calc() {

	// var total = math.eval('(0.08602500 * 0.69)')
	// util.log(total, 0.05935725)
	// var before = 0.059469926
	// var after = before - total
	// util.log("after", after)
	// var realAfter = 0.000053318
	// util.log("real after", realAfter)
	// var fee = after - realAfter
	// util.log("rate", fee / total)

	// util.log(math.eval('(0.014862574372372372 + 0.0008476276276276277)'))
	// util.log(math.eval('(0.5179952115116632 + 0.00084837)'))

	util.log(math.eval('1.0289830620165 + 0.1442831689787388 - 0.5859375 * 2'))

	util.log(math.eval('2.379964292134831 + 14.473966292134833 - 8.426966292134832 * 2'))

	util.log(math.eval('(0.0013910868303569867 - 0.0013912309952386348) / 0.0000020000000020559128'))

	util.log(math.eval('(0.072209877 + 0.0719550045)/2'))

	util.log(math.eval('0.495 - 0.01 * 0.087100'))


	util.log(math.eval('0.0000141 + 0.17056082 + 0.5268953118391635 + 0.26792178 - 0.9617394752115632'))

	util.log(math.eval('4.44047315 + 2.5680125 + 0.00054706744 + 2.089 - 9.09935371744'))

	util.log(math.eval('0.0006024715750144274 + 0.0007211568475453708 + 0.00015155528753346437 + 0.00038820055416382475 + 0.001176083976520569'))
	// var 

	// util.log(math.eval('(0.08602500 * 0.69)'))
	// util.log(math.eval('0.059469926 - (0.08602500 * 0.69)'))
	// util.log(math.eval('1 - 0.000053318 / (0.059469926 - 0.08602500 * 0.69)'))	
}

function test26() {
	var obj = {
		a: {
			price: 12
		},
		b: {
			price: 55
		}
	}

	var a = _.mean(_.map(obj, function(x) {
	  	return x.price
	}))

	util.log(a)
}

async function getData() {
	await util.sleep(1000)
	return "Make money"
}

async function test27() {
	try{
		var a = await util.promiseWithTimeout(
			// function() {
			// 	return util.sleep(1000)
			// }, 1500
			() => getData(),
			1500
		)

		util.log(a)
	}catch(e){
		util.log(e.message)
	}
}

function test28() {

	class Test {
		constructor() {
			this.obj = {
				a: {
					price: 12
				},
				b: {
					price: null
				},
				c: {
					price: 555
				}
			}
		}
		get filter() {
			return _.find(this.obj, function(e) { return e.price })
		}

		set bb(value) {
			this.b = value
		}
	}

	var test = new Test()

	for(var i in test.filter) {
		util.log(i, test.filter[i])
	}

	test.bb = "abc"
	util.log(test.b)
}

function test29() {
	var list = [
		{
			a: 1,
			b: 2
		},
		{
			a: 3,
			b: 5
		}
	]
	var a = _.reduce(list, function(result, value, key) {	  	
		result.a += value.a
		result.b += value.b
	  	return result
	}, {a: 0, b: 0})

	util.log(a)
}

function test30() {
	util.log(util.timestampFromTime("2017-11-04 00:00:00"))
	util.log(util.timestampFromTime("2017-11-08 00:00:00"))
}

function test31() {
	class A {
		constructor() {
			this.a = 1
		}
		change() {
			var a = this.a
			this.a = 2
			util.log(a)
			util.log(this.a)
		}
	}

	var a = new A()
	a.change()

	var x = 1
	var y = 2

	var r = {x, y, z: 3}
	util.log(r)
}

if (require.main === module) {
  	// 如果是直接执行 main.js，则进入此处
  	// 如果 main.js 被其他文件 require，则此处不会执行。
  	test31()
}