const _ = require('lodash')
const should = require('should');
const util = require('../util/util.js')
const TradeBuilder = require('../service/trade/tradeBuilder')


describe.only('测试 exchange', async function() {

	this.timeout(50000)

	before(async function() {
	})

	afterEach(async function(){
	})

  	describe.only('真实测试交易所API', async function() {
    	it('查询账户、订单簿、下单、取消', async function() {  

            var base = 'ETH', quote = 'BTC'
            var exchangeIDs = ['okex', 'huobipro', 'Bitfinex', 'Bittrex']

            let exchanges = getTradeBuilder(base, quote).buildExchanges(exchangeIDs)

            for(var id in exchanges) {
                let exchange = exchanges[id]
                await exchange.fetchAccount()
                util.log(JSON.stringify(await exchange.fetchOrderBook()))
                util.log('sell1Price', exchange.sell1Price)
                util.log('sell1Amount', exchange.sell1Amount)
                util.log("---------------------")
                util.log('buy1Price', exchange.buy1Price)
                util.log('buy1Amount', exchange.buy1Amount)
                // util.log(await exchange.limitBuy(0.1))
            }
    	})

        it('BCH查询账户、订单簿、下单、取消', async function() {
            var base = 'BCH', quote = 'BTC'
            var buyPrice = 0.01
            var sellPrice = 0.9
            var amount = 0.083

            var exchangeIDs = ['hitbtc']

            let exchanges = getTradeBuilder(base, quote).buildExchanges(exchangeIDs)

            // for(var id in exchanges) {
            //     let exchange = exchanges[id]
            //     await exchange.testOrder(buyPrice, sellPrice, amount)
            // }
        })

        it('BTC查询账户、订单簿、下单、取消', async function() {
            var base = 'BTC', quote = 'USD'
            var buyPrice = 1
            var sellPrice = 20000
            var amount = 0.01

            var exchangeIDs = ['huobipro']
            // var exchangeIDs = ['okex', 'huobipro', 'Quoine']

            let exchanges = getTradeBuilder(base, quote).buildExchanges(exchangeIDs)

            // for(var id in exchanges) {
            //     let exchange = exchanges[id]
            //     await exchange.testOrder(buyPrice, sellPrice, amount)
            // }
        })

        it('获取市场深度，返回数量压缩不超过5', async function() {
            var base = 'BTC', quote = 'USD', id = 'bitstamp'

            let exchanges = getTradeBuilder(base, quote).buildExchanges([id])

            var exchange = exchanges[id]
            var orderBook = await exchange.fetchOrderBook()
            util.log(orderBook)
            orderBook.bids.length.should.not.be.above(5)
            orderBook.asks.length.should.not.be.above(5)
        })
  	})

    describe.only('模拟测试下单', async function() {
        it('下单数量不能超出限额', async function() {

            var base = 'BCH', quote = 'BTC', id = 'Bitfinex'

            let exchanges = getTradeBuilder(base, quote).buildExchangesSim([id], 10, 100)

            var exchange = exchanges[id]

			await exchange.fetchAccount()

            exchange.orderBooks = {"bids":[[0.03860468,1],[0.029004,9.96],[0.029003,2.7],[0.029,3.2],[0.028823,0.0154],[0.0288,154.4348],[0.028797,1.1992],[0.028764,132.389],[0.028763,0.2387],[0.0287,10],[0.028535,0.0156],[0.028267,1.4165],[0.0282,1.3721],[0.0281,0.1],[0.028001,3.8],[0.027601,9.33],[0.0276,60.0096],[0.027515,1],[0.0272,0.0552],[0.02712,17.1526],[0.027,3.9007],[0.02684,0.02],[0.0264,21.2467],[0.026222,0.5],[0.026046,0.747],[0.0258,63.6164],[0.025672,2],[0.0255,7.0834],[0.0253,8.1739],[0.0252,99.3256],[0.025055,0.44],[0.025,40.7993],[0.0248,3.6955],[0.0247,0.0678],[0.0246,19.7816],[0.0245,0.631],[0.023956,3],[0.023003,18.1829],[0.023001,11],[0.023,5.1],[0.0227,91.9662],[0.022234,10],[0.022,0.1065],[0.021118,31.18],[0.021,1.4809],[0.020003,67.9137],[0.020001,5],[0.02,101.7592],[0.019,0.011],[0.01888,15.3442],[0.018,0.011],[0.017003,99.351],[0.017,100.011],[0.016,0.011],[0.015,6.189],[0.011111,10],[0.010002,100],[0.010001,5],[0.01,78.2634],[0.009,10],[0.0051,0.2156],[0.005001,102.1321],[0.0015,1.0652],[0.0012,0.5],[0.001111,76],[0.001,400],[0.0009,1],[0.0007,1.1],[0.0002,0.051],[0.00013,2],[0.00012,1.5],[0.0001,6.8749],[0.000025,10],[0.00002,100],[0.000013,21],[0.000012,25],[0.000009,100],[0.000008,35],[0.000003,0.2],[0.000002,2800],[0.000001,1263.9833]],"asks":[[0.0291,1.9434],[0.0293,0.0396],[0.029304,1],[0.029399,0.0013],[0.029407,0.0152],[0.029456,5],[0.029464,0.5723],[0.029469,3.2],[0.029568,0.5779],[0.029573,3.3],[0.029681,3.8],[0.029682,57.5],[0.029703,0.0151],[0.029728,6.7],[0.029734,3],[0.029735,0.5927],[0.029779,0.1163],[0.029789,13.2389],[0.0299,0.5793],[0.029915,0.7591],[0.03,59.4259],[0.030072,132.389],[0.0306,568.6956],[0.030623,0.1],[0.030658,0.1],[0.030976,0.0418],[0.031,10.662],[0.031007,6.511],[0.031048,1.8237],[0.0312,78.2495],[0.03129,0.0997],[0.031688,25.8],[0.031797,0.1],[0.0318,54.3442],[0.03189,0.1851],[0.031999,0.8337],[0.032,10.998],[0.032025,0.278],[0.0324,63.7385],[0.032574,3.0761],[0.0326,4.99],[0.0328,29.7767],[0.032995,2],[0.033,50.6629],[0.0332,27.8152],[0.033258,28.773],[0.0333,0.3299],[0.03333,30],[0.0335,14],[0.033507,0.1],[0.033995,1],[0.034,24.3],[0.034202,2.7171],[0.034207,0.685],[0.034308,5],[0.034351,44.8074],[0.0346,0.9308],[0.035,214.8841],[0.035577,2],[0.035627,0.0821],[0.0365,2],[0.03658,0.53],[0.036599,0.1],[0.0366,4.6049],[0.0368,0.1],[0.037,1.6543],[0.037416,1.4083],[0.037695,0.6855],[0.03866,14.1637],[0.038745,287.8757],[0.03899,200],[0.039,59.0255],[0.039109,0.5],[0.03924,10],[0.039586,13.8822],[0.039888,0.2],[0.04,124.5959],[0.0401,0.184],[0.040239,0.25],[0.04025,0.5],[0.041,5.228],[0.04149,0.337],[0.041796,0.029],[0.0418,1.8],[0.042,51.0034],[0.042129,45.0223],[0.04219,0.7545],[0.042258,0.998],[0.042383,3.6724],[0.042428,0.6643],[0.0425,0.5],[0.04268,0.3705],[0.042688,2],[0.0428,0.0031],[0.043151,0.4796],[0.043588,2],[0.04403,10.4483],[0.0443,9.0424],[0.0445,69.86],[0.044664,0.0487],[0.04488,1.3173],[0.044915,3.6696],[0.045,8.093],[0.04513,1],[0.0459,0.4786],[0.046,397.9598],[0.04603,1.5],[0.046855,0.0919],[0.04696,2],[0.047,0.3748],[0.047854,0.5714],[0.047888,0.2201],[0.04789,2.5],[0.048,62.7645],[0.0481,2],[0.048101,1.5087],[0.048376,6.5281],[0.048424,8.219],[0.048523,10.518],[0.0488,0.06],[0.04885,1.6342],[0.048999,0.9919],[0.049,3.7786],[0.049112,0.0998],[0.04913,300],[0.0495,0.1523],[0.049728,0.9927],[0.049794,0.0998],[0.04998,0.0998],[0.05,89.4636],[0.0502,0.0598],[0.0504,0.3],[0.0505,0.6478],[0.0506,300],[0.0508,2.5838],[0.051,506.6638],[0.051234,9.4053],[0.05158,1.5083],[0.05166,22.3803],[0.05169,1.9365],[0.051776,1.4475],[0.052,23.1915],[0.0529,0.1],[0.053,8.6978],[0.0544,1.2087],[0.0549,0.1],[0.055,35.5159],[0.05532,2.0096],[0.0555,23.6689],[0.0556,9.8301]],"timestamp":1512734507014,"datetime":"2017-12-08T12:01:47.014Z"}

            var tradeAmount = Math.min(exchange.amountCanBuy)

			// util.log(exchange.canSellSuch(0.02))

            exchange.limitBuy(tradeAmount)
        })

        it('下单数量精度为0的情况', async function() {

            var base = 'EOS', quote = 'BTC', id = 'binance'

            let exchanges = getTradeBuilder(base, quote).buildExchangesSim([id], 10, 100)

            var exchange = exchanges[id]

            await exchange.fetchAccount()

            exchange.orderBooks = {"bids":[[0.03860468,1],[0.029004,9.96],[0.029003,2.7],[0.029,3.2],[0.028823,0.0154],[0.0288,154.4348],[0.028797,1.1992],[0.028764,132.389],[0.028763,0.2387],[0.0287,10],[0.028535,0.0156],[0.028267,1.4165],[0.0282,1.3721],[0.0281,0.1],[0.028001,3.8],[0.027601,9.33],[0.0276,60.0096],[0.027515,1],[0.0272,0.0552],[0.02712,17.1526],[0.027,3.9007],[0.02684,0.02],[0.0264,21.2467],[0.026222,0.5],[0.026046,0.747],[0.0258,63.6164],[0.025672,2],[0.0255,7.0834],[0.0253,8.1739],[0.0252,99.3256],[0.025055,0.44],[0.025,40.7993],[0.0248,3.6955],[0.0247,0.0678],[0.0246,19.7816],[0.0245,0.631],[0.023956,3],[0.023003,18.1829],[0.023001,11],[0.023,5.1],[0.0227,91.9662],[0.022234,10],[0.022,0.1065],[0.021118,31.18],[0.021,1.4809],[0.020003,67.9137],[0.020001,5],[0.02,101.7592],[0.019,0.011],[0.01888,15.3442],[0.018,0.011],[0.017003,99.351],[0.017,100.011],[0.016,0.011],[0.015,6.189],[0.011111,10],[0.010002,100],[0.010001,5],[0.01,78.2634],[0.009,10],[0.0051,0.2156],[0.005001,102.1321],[0.0015,1.0652],[0.0012,0.5],[0.001111,76],[0.001,400],[0.0009,1],[0.0007,1.1],[0.0002,0.051],[0.00013,2],[0.00012,1.5],[0.0001,6.8749],[0.000025,10],[0.00002,100],[0.000013,21],[0.000012,25],[0.000009,100],[0.000008,35],[0.000003,0.2],[0.000002,2800],[0.000001,1263.9833]],"asks":[[0.0291,1.9434],[0.0293,0.0396],[0.029304,1],[0.029399,0.0013],[0.029407,0.0152],[0.029456,5],[0.029464,0.5723],[0.029469,3.2],[0.029568,0.5779],[0.029573,3.3],[0.029681,3.8],[0.029682,57.5],[0.029703,0.0151],[0.029728,6.7],[0.029734,3],[0.029735,0.5927],[0.029779,0.1163],[0.029789,13.2389],[0.0299,0.5793],[0.029915,0.7591],[0.03,59.4259],[0.030072,132.389],[0.0306,568.6956],[0.030623,0.1],[0.030658,0.1],[0.030976,0.0418],[0.031,10.662],[0.031007,6.511],[0.031048,1.8237],[0.0312,78.2495],[0.03129,0.0997],[0.031688,25.8],[0.031797,0.1],[0.0318,54.3442],[0.03189,0.1851],[0.031999,0.8337],[0.032,10.998],[0.032025,0.278],[0.0324,63.7385],[0.032574,3.0761],[0.0326,4.99],[0.0328,29.7767],[0.032995,2],[0.033,50.6629],[0.0332,27.8152],[0.033258,28.773],[0.0333,0.3299],[0.03333,30],[0.0335,14],[0.033507,0.1],[0.033995,1],[0.034,24.3],[0.034202,2.7171],[0.034207,0.685],[0.034308,5],[0.034351,44.8074],[0.0346,0.9308],[0.035,214.8841],[0.035577,2],[0.035627,0.0821],[0.0365,2],[0.03658,0.53],[0.036599,0.1],[0.0366,4.6049],[0.0368,0.1],[0.037,1.6543],[0.037416,1.4083],[0.037695,0.6855],[0.03866,14.1637],[0.038745,287.8757],[0.03899,200],[0.039,59.0255],[0.039109,0.5],[0.03924,10],[0.039586,13.8822],[0.039888,0.2],[0.04,124.5959],[0.0401,0.184],[0.040239,0.25],[0.04025,0.5],[0.041,5.228],[0.04149,0.337],[0.041796,0.029],[0.0418,1.8],[0.042,51.0034],[0.042129,45.0223],[0.04219,0.7545],[0.042258,0.998],[0.042383,3.6724],[0.042428,0.6643],[0.0425,0.5],[0.04268,0.3705],[0.042688,2],[0.0428,0.0031],[0.043151,0.4796],[0.043588,2],[0.04403,10.4483],[0.0443,9.0424],[0.0445,69.86],[0.044664,0.0487],[0.04488,1.3173],[0.044915,3.6696],[0.045,8.093],[0.04513,1],[0.0459,0.4786],[0.046,397.9598],[0.04603,1.5],[0.046855,0.0919],[0.04696,2],[0.047,0.3748],[0.047854,0.5714],[0.047888,0.2201],[0.04789,2.5],[0.048,62.7645],[0.0481,2],[0.048101,1.5087],[0.048376,6.5281],[0.048424,8.219],[0.048523,10.518],[0.0488,0.06],[0.04885,1.6342],[0.048999,0.9919],[0.049,3.7786],[0.049112,0.0998],[0.04913,300],[0.0495,0.1523],[0.049728,0.9927],[0.049794,0.0998],[0.04998,0.0998],[0.05,89.4636],[0.0502,0.0598],[0.0504,0.3],[0.0505,0.6478],[0.0506,300],[0.0508,2.5838],[0.051,506.6638],[0.051234,9.4053],[0.05158,1.5083],[0.05166,22.3803],[0.05169,1.9365],[0.051776,1.4475],[0.052,23.1915],[0.0529,0.1],[0.053,8.6978],[0.0544,1.2087],[0.0549,0.1],[0.055,35.5159],[0.05532,2.0096],[0.0555,23.6689],[0.0556,9.8301]],"timestamp":1512734507014,"datetime":"2017-12-08T12:01:47.014Z"}

            var tradeAmount = Math.min(exchange.amountCanSell, exchange.buy1Amount)

            exchange.limitBuy(tradeAmount)
        })

        it('下单后自动更新exchange account数据', async function() {

            let account1 = {
                binance: {
                    base: 100,
                    quote: 1
                }
            }

            let account2 = {
                binance: {
                    base: 10,
                    quote: 1
                }
            }

            let exchange1 = getTradeBuilder('EOS', 'BTC').buildExchangesSim(account1)['binance']

            let exchange2 = getTradeBuilder('ETH', 'BTC').buildExchangesSim(account2)['binance']

            await exchange1.fetchAccount()

            await exchange2.fetchAccount()

            // exchange1.orderBooks = {"bids":[[0.03860468,1],[0.029004,9.96],[0.029003,2.7],[0.029,3.2],[0.028823,0.0154],[0.0288,154.4348],[0.028797,1.1992],[0.028764,132.389],[0.028763,0.2387],[0.0287,10],[0.028535,0.0156],[0.028267,1.4165],[0.0282,1.3721],[0.0281,0.1],[0.028001,3.8],[0.027601,9.33],[0.0276,60.0096],[0.027515,1],[0.0272,0.0552],[0.02712,17.1526],[0.027,3.9007],[0.02684,0.02],[0.0264,21.2467],[0.026222,0.5],[0.026046,0.747],[0.0258,63.6164],[0.025672,2],[0.0255,7.0834],[0.0253,8.1739],[0.0252,99.3256],[0.025055,0.44],[0.025,40.7993],[0.0248,3.6955],[0.0247,0.0678],[0.0246,19.7816],[0.0245,0.631],[0.023956,3],[0.023003,18.1829],[0.023001,11],[0.023,5.1],[0.0227,91.9662],[0.022234,10],[0.022,0.1065],[0.021118,31.18],[0.021,1.4809],[0.020003,67.9137],[0.020001,5],[0.02,101.7592],[0.019,0.011],[0.01888,15.3442],[0.018,0.011],[0.017003,99.351],[0.017,100.011],[0.016,0.011],[0.015,6.189],[0.011111,10],[0.010002,100],[0.010001,5],[0.01,78.2634],[0.009,10],[0.0051,0.2156],[0.005001,102.1321],[0.0015,1.0652],[0.0012,0.5],[0.001111,76],[0.001,400],[0.0009,1],[0.0007,1.1],[0.0002,0.051],[0.00013,2],[0.00012,1.5],[0.0001,6.8749],[0.000025,10],[0.00002,100],[0.000013,21],[0.000012,25],[0.000009,100],[0.000008,35],[0.000003,0.2],[0.000002,2800],[0.000001,1263.9833]],"asks":[[0.0291,1.9434],[0.0293,0.0396],[0.029304,1],[0.029399,0.0013],[0.029407,0.0152],[0.029456,5],[0.029464,0.5723],[0.029469,3.2],[0.029568,0.5779],[0.029573,3.3],[0.029681,3.8],[0.029682,57.5],[0.029703,0.0151],[0.029728,6.7],[0.029734,3],[0.029735,0.5927],[0.029779,0.1163],[0.029789,13.2389],[0.0299,0.5793],[0.029915,0.7591],[0.03,59.4259],[0.030072,132.389],[0.0306,568.6956],[0.030623,0.1],[0.030658,0.1],[0.030976,0.0418],[0.031,10.662],[0.031007,6.511],[0.031048,1.8237],[0.0312,78.2495],[0.03129,0.0997],[0.031688,25.8],[0.031797,0.1],[0.0318,54.3442],[0.03189,0.1851],[0.031999,0.8337],[0.032,10.998],[0.032025,0.278],[0.0324,63.7385],[0.032574,3.0761],[0.0326,4.99],[0.0328,29.7767],[0.032995,2],[0.033,50.6629],[0.0332,27.8152],[0.033258,28.773],[0.0333,0.3299],[0.03333,30],[0.0335,14],[0.033507,0.1],[0.033995,1],[0.034,24.3],[0.034202,2.7171],[0.034207,0.685],[0.034308,5],[0.034351,44.8074],[0.0346,0.9308],[0.035,214.8841],[0.035577,2],[0.035627,0.0821],[0.0365,2],[0.03658,0.53],[0.036599,0.1],[0.0366,4.6049],[0.0368,0.1],[0.037,1.6543],[0.037416,1.4083],[0.037695,0.6855],[0.03866,14.1637],[0.038745,287.8757],[0.03899,200],[0.039,59.0255],[0.039109,0.5],[0.03924,10],[0.039586,13.8822],[0.039888,0.2],[0.04,124.5959],[0.0401,0.184],[0.040239,0.25],[0.04025,0.5],[0.041,5.228],[0.04149,0.337],[0.041796,0.029],[0.0418,1.8],[0.042,51.0034],[0.042129,45.0223],[0.04219,0.7545],[0.042258,0.998],[0.042383,3.6724],[0.042428,0.6643],[0.0425,0.5],[0.04268,0.3705],[0.042688,2],[0.0428,0.0031],[0.043151,0.4796],[0.043588,2],[0.04403,10.4483],[0.0443,9.0424],[0.0445,69.86],[0.044664,0.0487],[0.04488,1.3173],[0.044915,3.6696],[0.045,8.093],[0.04513,1],[0.0459,0.4786],[0.046,397.9598],[0.04603,1.5],[0.046855,0.0919],[0.04696,2],[0.047,0.3748],[0.047854,0.5714],[0.047888,0.2201],[0.04789,2.5],[0.048,62.7645],[0.0481,2],[0.048101,1.5087],[0.048376,6.5281],[0.048424,8.219],[0.048523,10.518],[0.0488,0.06],[0.04885,1.6342],[0.048999,0.9919],[0.049,3.7786],[0.049112,0.0998],[0.04913,300],[0.0495,0.1523],[0.049728,0.9927],[0.049794,0.0998],[0.04998,0.0998],[0.05,89.4636],[0.0502,0.0598],[0.0504,0.3],[0.0505,0.6478],[0.0506,300],[0.0508,2.5838],[0.051,506.6638],[0.051234,9.4053],[0.05158,1.5083],[0.05166,22.3803],[0.05169,1.9365],[0.051776,1.4475],[0.052,23.1915],[0.0529,0.1],[0.053,8.6978],[0.0544,1.2087],[0.0549,0.1],[0.055,35.5159],[0.05532,2.0096],[0.0555,23.6689],[0.0556,9.8301]],"timestamp":1512734507014,"datetime":"2017-12-08T12:01:47.014Z"}

            await exchange1.testOrder(0.0009, 0.0009, 3)

            util.log(exchange1.account)

            util.log(exchange2.account)

            await exchange2.testOrder(0.09, 0.09, 2)

            util.log(exchange1.account)

            util.log(exchange2.account)
        })
    })

    function getTradeBuilder(base, quote) {
        return new TradeBuilder(`${base}/${quote}`, true)
    }
})