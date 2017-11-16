const _ = require('lodash')
let bluebird = require("bluebird")
let redis = require("redis"),
    client = redis.createClient();
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const Log = require ('ololog').configure ({ locate: false })    

function getRate(fiat) {
	var fiats = {
		"USD": 6.5807,
		"USDT": 6.5807,
		"JPY": 0.0585,
		"EUR": 7.7678,
		"WUSD": 6.5807,
	}
	return fiats[fiat]
}

function printDetails(details) {

}

function adjustFloat(v) {                 // 处理数据的自定义函数 ，可以把参数 v 处理 返回 保留3位小数（floor向下取整）
    return Math.floor(v*1000)/1000;       // 先乘1000 让小数位向左移动三位，向下取整 整数，舍去所有小数部分，再除以1000 ， 小数点向右移动三位，即保留三位小数。
}

var print = function() {
	var listAll = []
    var listSell = []
    var listBuy = []
    var finalList = []
    for(var item of listAll){
        if(listSell.includes(item.sell) && listBuy.includes(item.sell) && 
           listSell.includes(item.buy) && listBuy.includes(item.buy)) {
            finalList.push(item)
        }
    }

    finalList.sort(function(a, b){return b.profit - a.profit})

    for(var item of finalList) {
        Log(`Sell: ${item.sell}, Buy: ${item.buy}, Profit: ${item.profit}`)
    }
}

async function display() {

	var key

	if (process.argv.length < 3) {
		var keys = (await client.keysAsync('Hedge*')).sort()
		key = keys[keys.length-1]
	}else if (process.argv.length == 3){
		key = process.argv.slice(2)
	}

	var data = JSON.parse(await client.getAsync(key))

    Log.bright.red("************************************************")	
    Log.bright.green("参与交易所：")
    var byExchange = {}
    for(var i in data.exchanges) {
    	Log.bright.green(data.exchanges[i])
    	byExchange[data.exchanges[i]] = {
    		sell: {
    			times: 0,
    			profit: 0,
    			amount: 0
    		},
    		buy: {
    			times: 0,
    			profit: 0,
    			amount: 0
    		},
    		details: []
    	}    	
    }
	Log.bright.green(`开始时间: ${data.startTime}，更新时间: ${data.lastUpdate}`)
	Log.bright.green(`初始金额: ${data.initTotalBalance}，初始币: ${data.initTotalStock}`)
	Log.bright.red(`对冲次数: ${data.tradeTimes}, 盈利: ${data.profit}, 钱差: ${data.balanceGap}, 币差: ${data.stocksGap}`)
	Log.bright.red("************************************************")

	var details = data.details

	for(var item of details) {
		var sellName = item.sell
		var buyName = item.buy
		// Log("sellName", sellName, "buyName", buyName)
		byExchange[sellName].sell.times += 1
		byExchange[sellName].sell.amount += item.amount
		byExchange[sellName].sell.profit += item.profit

		byExchange[buyName].buy.times += 1
		byExchange[buyName].buy.amount += item.amount
		byExchange[buyName].buy.profit += item.profit

		byExchange[buyName].details.push({
			sell: sellName,
			buy: buyName,
			amount: item.amount,
			profit: item.profit,
			time: item.time
		})

		byExchange[sellName].details.push({
			sell: sellName,
			buy: buyName,
			amount: item.amount,
			profit: item.profit,
			time: item.time
		})
	}

	var result = []
	for(var name in byExchange) {
		result.push({
			name: name,
			sell: byExchange[name].sell,
			buy: byExchange[name].buy,
			total: {
				times: byExchange[name].sell.times + byExchange[name].buy.times,
				profit: byExchange[name].sell.profit + byExchange[name].buy.profit,
				amount: byExchange[name].sell.amount + byExchange[name].buy.amount,
			}
		})
	}

	result.sort(function(a, b) {return b.total.profit - a.total.profit})

	for(var item of result) {
		Log.yellow("---------------------------")
		Log(item.name, "sell.times:", item.sell.times, "sell.profit:", item.sell.profit, "sell.amount:", item.sell.amount)
		Log(item.name, "buy.times:", item.buy.times, "buy.profit:", item.buy.profit, "buy.amount:", item.buy.amount)
		Log(item.name, "total.times:", item.total.times, "total.profit:", item.total.profit, "total.amount:", item.total.amount)
	}

	// for(var i in byExchange) {
	// 	Log(i, "detail:")
	// 	for(var item of byExchange[i].details) {
	// 		Log(item)
	// 		// Log("Time", item.time, "Sell", item.sell, "Buy", item.buy, "amount", item.amount, "profit", item.profit)		
	// 	}		
	// }


	Log("平均gap", _.meanBy(details, function(o) { return o.margin }))

	// var total = _.reduce(details, function(result, value, key) {	  	
	// 	result.balance += value.balance
	// 	result.stocks += value.stocks
	//   	return result
	// }, {gap: 0})

	var pairs = {}
	_.forEach(details, function(value, key) {
		var key = value.sell + "->" + value.buy
		if(pairs[key]){
			pairs[key].times += 1
			pairs[key].profit += value.profit			
		}else{
			pairs[key] = {
				times: 1,
				profit: value.profit,
				key: key
			}
		}
		// Log(value)
	})

	Log("By Profit")

	var byProfit = _.orderBy(pairs, 'profit', 'desc')

	_.forEach(byProfit, function(value, key) {
		Log(`${value.key}, times: ${value.times}, profit: ${value.profit}`)
	})

	Log("By Times")

	var byTimes = _.orderBy(pairs, 'times', 'desc')

	_.forEach(byTimes, function(value, key) {
		Log(`${value.key}, times: ${value.times}, profit: ${value.profit}`)
	})
	
	process.exit()
}

async function main() {

	var keys = await client.keysAsync('Hedge:*')
	var values = await client.mgetAsync(keys)
	var result = []

	Log.bright.red("************************************************")	
	Log.bright.red("************************************************")

	for(var i in values) {
		var list = JSON.parse(values[i])

		// list.sort(function(a, b) {return b.profit - a.profit})

		Log.bright.green("***", keys[i], "***")
		var total = 0
		for(var item of list) {
			total += item.profit
			Log(`Sell: ${item.sell}, Buy: ${item.buy}, Profit: ${adjustFloat(item.profit)}, Time: ${item.timte}`)
		}
		result.push({
			name: keys[i],
			total: total
		})
	}

	for(var i of result) {
		Log(i.name, i.total)
	}
	
	process.exit()
}
display()