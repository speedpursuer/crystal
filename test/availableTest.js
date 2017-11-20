const should = require('should');
const Available = require('../service/API/available.js')
const util = require('../util/util.js')


describe('单元测试available', async function() {	

	this.timeout(50000)

	before(async function() {
    	
	})

	afterEach(async function(){
		
	})

  	describe('模拟从正常到异常', async function() {  		
    	it('如设计', async function() {  

            class Test {
                constructor() {
                    this.available = new Available(this.check)
                }

                check() {
                    util.log("check")
                    // await util.sleep(300)
                    return false
                }    

                use() {
                    if(this.available.isAvailable) {
                        util.log("used")
                    }else {
                        util.log("Not avalable")
                    }
                }

                async run() {
                    this.use()
                    this.available.checkin(true)
                    this.use()
                    this.available.checkin(false)
                    this.available.checkin(false)
                    this.available.checkin(false)
                    this.use()              
                    this.available.checkin(true)      
                    this.use()
                    while(!this.available.isAvailable) {
                        await util.sleep(300)
                        this.use()
                        this.available.checkin(true)
                    }
                }
            }

            var test = new Test()
            test.run()
    	})
  	})
})