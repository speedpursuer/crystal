const should = require('should');
const Database = require('../service/database.js')
const util = require('../util/util.js')


describe.only('Database class', async function() {

	var database = new Database('Test')
	var curreData

	before(async function() {		
		await database.init()
	})

	afterEach(async function(){
		util.log("afterEach", curreData)
	})

  	describe('recordTrade', async function() {  		
    	it('可以保存交易记录', async function() {    		      		
      		await database.recordTrade('k', 'p', 5000, 0.56)
      		curreData = await database.getData()      
      		curreData.details.length.should.equal(1)
    	})
  	})

  	describe('recordBalance', async function() {  		
    	it('交易结果不应该为0', async function() {
    		await database.recordBalance(50, -1)
    		curreData = await database.getData()
    		curreData.balanceGap.should.equal(50)
    	})
  	})
})