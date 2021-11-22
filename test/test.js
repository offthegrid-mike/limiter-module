import should from 'should';
import {userStorage} from '../storage.js'
import {rateLimiter} from '../rateLimiter.js'
import {requestAlgorithm} from '../requestAlgorithm.js'

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

    it ('isExist function', done => {
        const storage = new userStorage();
        const strategy = new requestAlgorithm();
        var user = strategy.createNewUserRequest(Date.now(), 1, 1)
        storage.setValue("key-A", user)
        user = strategy.createNewUserRequest(Date.now(), 1, 1)
        storage.setValue("key-B", user)
        user = strategy.createNewUserRequest(Date.now(), 1, 1)
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
        const strategy = new requestAlgorithm();
        var user = strategy.createNewUserRequest(Date.now(), 1, 1)
        storage.setValue("key-A", user)
        user = strategy.createNewUserRequest(Date.now(), 1, 1)
        storage.setValue("key-B", user)
        user = strategy.createNewUserRequest(Date.now(), 1, 1)
        storage.setValue("key-C", user)
        
        var actual = storage.userMap.size;
        var expect = 3;
        expect.should.equal(actual)
        
        done()
    })

    it ('getValue function', done => {
        const storage = new userStorage();
        const strategy = new requestAlgorithm();
        var userA = strategy.createNewUserRequest(Date.now(), 1, 1)
        storage.setValue("key-A", userA)
        var userB = strategy.createNewUserRequest(Date.now(), 1, 1)
        storage.setValue("key-B", userB)
        var userC = strategy.createNewUserRequest(Date.now(), 1, 1)
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
        const algorithm = new requestAlgorithm();
        const limiter = new rateLimiter(storage, algorithm, 1, 1);

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
        const algorithm = new requestAlgorithm();
        const limiter = new rateLimiter(storage, algorithm, 1, 1);

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
        const algorithm = new requestAlgorithm();
        const limiter = new rateLimiter(storage, algorithm, 1, 1);

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
        const algorithm = new requestAlgorithm();
        const limiter = new rateLimiter(storage, algorithm, 100, 1);

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
        const algorithm = new requestAlgorithm();
        const limiter = new rateLimiter(storage, algorithm, 100, 1);

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

describe ("Unit Test - Request Algorithm", () => {
    // unit test on request algorithm
    it ('user detail constructor', done => {
        const strategy = new requestAlgorithm();
        const currentTS = Date.now()
        var userA = strategy.createNewUserRequest(currentTS, 1, 1);
        var userB = strategy.createNewUserRequest(currentTS, 1, 1);

        should.deepEqual(userA, userB) // use structural equality
        done()
    })

    it ('user make request function', done => {
        const strategy = new requestAlgorithm();
        const currentTS = Date.now()
        var user = strategy.createNewUserRequest(currentTS, 1, 1);
        const actual = strategy.canUserMakeRequest(user, currentTS, 1, 1);
        const expect = false;

        expect.should.equal(actual)
        done()
    })

    it ('update user request', done => {
        const strategy = new requestAlgorithm();
        const currentTS = Date.now()
        var user = strategy.createNewUserRequest(currentTS, 1, 1);
        const newUser = strategy.updateUserRequest(user, currentTS, 1, 2);
        const expect = 2;

        expect.should.equal(newUser.attempt)
        done()
    })

    it ('update user request with excessive', done => {
        const strategy = new requestAlgorithm();
        const currentTS = Date.now()
        var user = strategy.createNewUserRequest(currentTS, 1, 1);
        user.attempt = 10;
        const newUser = strategy.updateUserRequest(user, currentTS, 1, 10);
        const expect = 10;

        expect.should.equal(newUser.attempt)
        done()
    })

    it ('obtain remaining timeout', async() => {
        const strategy = new requestAlgorithm();
        let currentTS = Date.now()
        var user = strategy.createNewUserRequest(currentTS, 1, 1);
        user.attempt = 10;

        // wait more than 1 seconds
        await wait(1500);

        currentTS = Date.now()
        const actual = strategy.obtainRemainingTimeout(user, currentTS, 10, 10);
        const expect = 10;

        expect.should.greaterThanOrEqual(actual);
    })
})
