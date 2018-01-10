const should = require('should');
const Available = require('../util/available.js')
const util = require('../util/util.js')


describe('单元测试available', async function() {	

	this.timeout(50000)

    var test

	before(async function() {

	})
    
    beforeEach(async function () {
        class Test {
            constructor() {
                this.available = new Available(3000, 2, 2000, 10000, 2)
                this.checkFlag = true
                var that = this
                this.available.on('check', function() {
                    util.log("check")
                    that.available.reportCheck(that.checkFlag)
                })

                this.available.on('closed', function() {
                    util.log("closed")
                })
            }

            use() {
                if(this.available.isAvailable) {
                    util.log("In use")
                }else {
                    util.log("Not avalable")
                }
                return this.available.isAvailable
            }
        }
        test = new Test()
    })

	afterEach(async function(){
	    // util.log("afterEach")
	})

  	describe('正常情况', async function() {
    	it('2次以下正常', async function() {
            test.use().should.equal(true)
            test.available.reportIssue()
            await util.sleep(100)
            test.use().should.equal(true)

            test.available.reportIssue()
            await util.sleep(100)
            test.use().should.equal(true)
    	})
  	})


    describe('异常情况', async function() {
        it('3次不正常', async function() {
            test.available.reportIssue()
            await util.sleep(100)
            test.use().should.equal(true)
            test.available.reportIssue()
            await util.sleep(100)
            test.use().should.equal(true)
            test.available.reportIssue()
            test.use().should.equal(false)
        })

        it('3次，但超过规定时间，正常', async function() {
            test.available.reportIssue()
            await util.sleep(2000)
            test.use()
            test.available.reportIssue()
            await util.sleep(1000)
            test.use()
            test.available.reportIssue()
            test.use().should.equal(true)
        })
    })


    describe('失败重试', async function() {
        it('失败后，自动恢复正常', async function() {
            test.available.reportIssue()
            test.available.reportIssue()
            test.available.reportIssue()

            test.use().should.equal(false)

            await util.sleep(6000)
            test.use().should.equal(true)
        })

        it('失败后，自动恢复失败', async function() {
            test.checkFlag = false
            test.available.reportIssue()
            test.available.reportIssue()
            test.available.reportIssue()

            test.use().should.equal(false)

            for(var i=1; i<20; i++) {

                if(i == 7) {
                    test.use().should.equal(false)
                    test.checkFlag = true
                }

                util.log(i)
                await util.sleep(500)
            }

            test.use().should.equal(true)
        })
    })

    describe('严重错误', async function() {
        it('严重问题', async function() {
            test.checkFlag = true
            test.available.reportIssue(true)
            test.use().should.equal(false)

            for(var i=1; i<10; i++) {
                if(i == 4) {
                    test.use().should.equal(false)
                    test.checkFlag = true
                }

                util.log(i)
                await util.sleep(500)
            }

            test.use().should.equal(true)
        })
    })

    describe('康复情况', async function() {
        it('有限次的重试（康复）', async function() {
            test.checkFlag = true
            test.available.reportIssue(true)
            test.use().should.equal(false)

            await util.sleep(3000)

            test.available.reportIssue(true)

            await util.sleep(3000)

            test.available.reportIssue(true)

            test.available.closed.should.equal(true)
        })

        it('有限次的重试（康复）- 超时', async function() {
            test.checkFlag = true
            test.available.reportIssue(true)
            test.use().should.equal(false)

            await util.sleep(3000)

            test.available.reportIssue(true)

            await util.sleep(8000)

            test.available.reportIssue(true)

            test.available.closed.should.equal(false)
        })

        it('无限次的重试（康复失败）', async function() {
            test.checkFlag = false
            test.available.reportIssue(true)
            test.use().should.equal(false)

            await util.sleep(1000)
            test.available.reportIssue(true)

            await util.sleep(1000)
            test.available.reportIssue(true)

            await util.sleep(1000)
            test.available.reportIssue(true)
            test.available.closed.should.equal(false)
        })
    })
})