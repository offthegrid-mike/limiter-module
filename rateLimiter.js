export function rateLimiter(storage, strategy, limit, period) {
    
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
            let userIsExist = await storage.isExist(APIKey);
            let requestSuccess = false

            let userDetail = await storage.getValue(APIKey);
            if (userIsExist) {
                requestSuccess = strategy.canUserMakeRequest(userDetail, currentTS, period, limit);
                if (requestSuccess) {
                    let updatedUserDetail = strategy.updateUserRequest(userDetail, currentTS, period, limit)
                    await storage.setValue(APIKey, updatedUserDetail)
                }
            }
            else {
                userDetail = strategy.createNewUserRequest(currentTS, period, limit);
                if (userDetail !== null) {
                    await storage.setValue(APIKey, userDetail);
                    requestSuccess = true;
                }
                else {
                    requestSuccess = false;
                }
            }

            if (requestSuccess)
                successBlock();
            else
                failedBlock(strategy.obtainRemainingTimeout(userDetail, currentTS, period, limit));

            return requestSuccess;
        }
    }
}
