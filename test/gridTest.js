const should = require('should');
const Available = require('../service/API/util/available.js')
const util = require('../util/util.js')
const TradeBuilder = require('../service/trade/tradeBuilder')
const Grid = require('../strategy/grid')


describe('单元测试grid', async function() {

	this.timeout(50000)

	before(async function() {

	})
    
    beforeEach(async function () {
    })

	afterEach(async function(){
	})

    describe('正常情况', async function() {
        it('getOrderAmount', async function() {
            let account = {
                binance: {
                    base: 100,
                    quote: 1
                }
            }
            let exchange = getTradeBuilder('BCH', 'BTC').buildExchangesSim(account)['binance']
            await exchange.fetchAccount()
            exchange.orderBooks = {"bids":[[0.03860468,1],[0.029004,9.96],[0.029003,2.7],[0.029,3.2],[0.028823,0.0154],[0.0288,154.4348]],"asks":[[0.0291,1.9434],[0.0293,0.0396],[0.029304,1],[0.029399,0.0013],[0.029407,0.0152],[0.029456,5]]}
            let grid = new Grid(9000, 5, 3000, 5, exchange)

            // let price = 9700
            // let amount = doGrid(grid, price)
            //
            // grid.lastTrade = {
            //     price: price,
            //     amount: amount
            // }
            //
            // price = 10000
            // amount = doGrid(grid, price)
            //
            // grid.lastTrade = {
            //     price: price,
            //     amount: amount
            // }

            doGrid(grid, 9700)
            doGrid(grid, 10000)
            doGrid(grid, 11002)
            doGrid(grid, 13003)
            doGrid(grid, 15004)
            doGrid(grid, 8005)
        })

        // it('3次，但超过规定时间，正常', async function() {
        //     test.available.reportIssue()
        //     await util.sleep(2000)
        //     test.use()
        //     test.available.reportIssue()
        //     await util.sleep(1000)
        //     test.use()
        //     test.available.reportIssue()
        //     test.use().should.equal(true)
        // })
    })

    function doGrid(gridObj, price) {
        let grid = gridObj.getGrid(price)
        let amount = gridObj.getOrderAmount(grid)
        gridObj.recordTrade(amount, amount, price, grid)
    }

    function getTradeBuilder(base, quote) {
        return new TradeBuilder(`${base}/${quote}`, true)
    }
})