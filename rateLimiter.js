export function rateLimiter(storage, limit, period) {
    
    return {
        process: async (APIKey, res) => {
            if (APIKey == "") {
                res.status(400).send("Please pass a correct API Key");
                return false;
            }

            const successBlock = () => {
                res.send("Request successfully");
            };
        
            const failedBlock = (s) => {
                res.status(429).send(`Rate limit exceeded. Try again in #${s} seconds`);
            }

            const currentTS = Date.now(); 
            var result = false;
            if (await !storage.isExist(APIKey)) {
                const user = new storage.userDetailFactory.userDetail(currentTS);
                await storage.setValue(APIKey, user);
                successBlock();
                result = true;
            }
            else {
                var user = await storage.getValue(APIKey);
                const tsDiff = (currentTS - user.ts) / 1000; // TODO: decimal round up 
                // reset attempt if difference is exceeded waiting period
                if (tsDiff > period) {
                    user = new storage.userDetailFactory.userDetail(currentTS);
                    await storage.setValue(APIKey, user); // replace existed
                    successBlock();
                    result = true;
                }
                else if (user.attempt == limit) {
                        failedBlock(Math.round((user.ts + period * 1000 - currentTS)/ 1000));
                        result = false;
                }
                else {
                    user.attempt++;
                    await storage.setValue(APIKey, user);
                    successBlock();
                    result = true;
                }
            }
            return result;
        }
    }
}
