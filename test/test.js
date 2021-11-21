import should from 'should';
import {userStorage} from '../storage.js'
import {rateLimiter} from '../rateLimiter.js'

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

describe ("Unit Test - Storage", () => {
    // Unit test on storage
    it('empty map', done => {
        const storage = new userStorage();

        const actual = storage.userMap.size;
        const expect = 0;
        expect.should.equal(actual)

        done()
    })

    it ('user detail factory constructor', done => {
        const storage = new userStorage();
        const currentTS = Date.now()
        var userA = new storage.userDetailFactory.userDetail(currentTS)
        var userB = new storage.userDetailFactory.userDetail(currentTS)

        should.deepEqual(userA, userB) // use structural equality
        done()
    })

    it ('isExist function', done => {
        const storage = new userStorage();
        var user = new storage.userDetailFactory.userDetail(Date.now())
        storage.setValue("key-A", user)
        user = new storage.userDetailFactory.userDetail(Date.now())
        storage.setValue("key-B", user)
        user = new storage.userDetailFactory.userDetail(Date.now())
        storage.setValue("key-C", user)
        
        var actual = storage.isExist("key-A");
        var expect = true;
        expect.should.equal(actual)

        actual = storage.isExist("key-B");
        expect = true;
        expect.should.equal(actual)

        actual = storage.isExist("key-C");
        expect = true;
        expect.should.equal(actual)

        actual = storage.isExist("key-D");
        expect = false;
        expect.should.equal(actual)
        
        done()
    })

    it ('setValue function', done => {
        const storage = new userStorage();
        var user = new storage.userDetailFactory.userDetail(Date.now())
        storage.setValue("key-A", user)
        user = new storage.userDetailFactory.userDetail(Date.now())
        storage.setValue("key-B", user)
        user = new storage.userDetailFactory.userDetail(Date.now())
        storage.setValue("key-C", user)
        
        var actual = storage.userMap.size;
        var expect = 3;
        expect.should.equal(actual)
        
        done()
    })

    it ('getValue function', done => {
        const storage = new userStorage();
        var userA = new storage.userDetailFactory.userDetail(Date.now())
        storage.setValue("key-A", userA)
        var userB = new storage.userDetailFactory.userDetail(Date.now())
        storage.setValue("key-B", userB)
        var userC = new storage.userDetailFactory.userDetail(Date.now())
        storage.setValue("key-C", userC)
        
        var actual = storage.getValue("key-A");
        var expect = userA;
        expect.should.equal(actual)

        actual = storage.getValue("key-B");
        expect = userB;
        expect.should.equal(actual)

        actual = storage.getValue("key-C");
        expect = userC;
        expect.should.equal(actual)

        actual = storage.getValue("key-D");
        expect = undefined
        should.equal(actual, expect)
        
        done()
    })

})

describe ("Unit Test - Rate Limiter", () => {
    // unit test on rete limiter
    it('invalid API', async () => {
        const storage = new userStorage();
        const limiter = new rateLimiter(storage, 1, 1);

        let res = {
            respStatus: 0,
            dataMsg: "",
            send: function(msg) { 
                this.dataMsg = msg;
                return this
            },
            status: function(responseStatus) {
                this.respStatus = responseStatus;
                return this; 
            }
        }

        var actual = await limiter.process("", res);
        var expect = false;
        should.equal(actual, expect);

        actual = res.dataMsg;
        expect = "Please pass a correct API Key";
        should.equal(actual, expect);
    })

    it('valid API', async () => {
        const storage = new userStorage();
        const limiter = new rateLimiter(storage, 1, 1);

        let res = {
            respStatus: 0,
            dataMsg: "",
            send: function(msg) { 
                this.dataMsg = msg;
                return this
            },
            status: function(responseStatus) {
                this.respStatus = responseStatus;
                return this; 
            }
        }

        let actual = await limiter.process("key-A", res);
        let expect = true;
        should.equal(actual, expect);

        actual = res.dataMsg;
        expect = "Request successfully";
        should.equal(actual, expect);
    })

    it('valid API - storage data checking', async () => {
        const storage = new userStorage();
        const limiter = new rateLimiter(storage, 1, 1);

        let res = {
            send: function(msg) { 
                return this
            },
            status: function(responseStatus) {
                // assert.equal(responseStatus, 404);
                return this; 
            }
        }

        var actual = await limiter.process("key-A", res);
        let expect = true;
        should.equal(actual, expect);

        var storageActual = storage.userMap.size;
        var storageExpect = 1;
        should.equal(storageActual, storageExpect);
        
        storageActual = storage.isExist("key-A");
        storageExpect = true;
        should.equal(storageActual, storageExpect);

        storageActual = storage.getValue("key-A").ts;
        storageExpect = Date.now();
        storageActual.should.be.belowOrEqual(storageExpect);
    })

    it('valid API - excessive API request', async () => {
        const storage = new userStorage();
        const limiter = new rateLimiter(storage, 100, 1);

        let res = {
            respStatus: 0,
            dataMsg: "",
            send: function(msg) { 
                this.dataMsg = msg;
                return this
            },
            status: function(responseStatus) {
                this.respStatus = responseStatus;
                return this; 
            }
        }

        for (let i = 0; i < 100; i++) {
            await limiter.process("key-A", res);
            
            const actual = res.dataMsg
            const expect = "Request successfully";
            should.equal(actual, expect);
        }

        // 101st time
        var actual = await limiter.process("key-A", res);
        let expect = false;
        should.equal(actual, expect);

        actual = res.respStatus;
        expect = 429;
        should.equal(actual, expect);

        actual = res.dataMsg;
        expect = "Rate limit exceeded. Try again in #1 seconds";
        should.equal(actual, expect);

        var storageActual = storage.userMap.size;
        var storageExpect = 1;
        should.equal(storageActual, storageExpect);
        
        storageActual = storage.isExist("key-A");
        storageExpect = true;
        should.equal(storageActual, storageExpect);

        storageActual = storage.getValue("key-A").attempt;
        storageExpect = 100;
        should.equal(storageActual, storageExpect);
    })


    it('valid API - request after blockage', async () => {
        const storage = new userStorage();
        const limiter = new rateLimiter(storage, 100, 1);

        let res = {
            respStatus: 0,
            dataMsg: "",
            send: function(msg) { 
                this.dataMsg = msg;
                return this
            },
            status: function(responseStatus) {
                this.respStatus = responseStatus;
                return this; 
            }
        }

        for (let i = 0; i < 100; i++) {
            await limiter.process("key-A", res);
            
            const actual = res.dataMsg
            const expect = "Request successfully";
            should.equal(actual, expect);
        }

        // 101st time
        var actual = await limiter.process("key-A", res);
        let expect = false;
        should.equal(actual, expect);

        actual = res.respStatus;
        expect = 429;
        should.equal(actual, expect);

        actual = res.dataMsg;
        expect = "Rate limit exceeded. Try again in #1 seconds";
        should.equal(actual, expect);

        var storageActual = storage.userMap.size;
        var storageExpect = 1;
        should.equal(storageActual, storageExpect);
        
        storageActual = storage.isExist("key-A");
        storageExpect = true;
        should.equal(storageActual, storageExpect);

        storageActual = storage.getValue("key-A").attempt;
        storageExpect = 100;
        should.equal(storageActual, storageExpect);

        // wait more than 1 second
        await wait(1500);

        actual = await limiter.process("key-A", res);
        expect = true;
        should.equal(actual, expect);

        storageActual = storage.getValue("key-A").attempt;
        storageExpect = 1;
        should.equal(storageActual, storageExpect);
    })
})