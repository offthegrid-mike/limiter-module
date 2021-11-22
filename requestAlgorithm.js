export function requestAlgorithm () {

    var userDetail = function(ts) {
        this.ts = ts;
        this.attempt = 1; // on creation: first attempt
    }

    function canUserMakeRequest(user, currentTS, period, limit) {
        const tsDiff = (currentTS - user.ts) / 1000;
        if (tsDiff > period)
            return true;
        else if (user.attempt >= limit)
            return false;
        else 
            return true;
    }

    function updateUserRequest(user, currentTS, period, limit) {
        const tsDiff = (currentTS - user.ts) / 1000;
        if (tsDiff > period) {
            user.ts = currentTS;
            user.attempt = 1;
        }
        else if (user.attempt < limit)
            user.attempt++;
        return user;
    }

    function createNewUserRequest(currentTS, period, limit) {
        const user = new userDetail(currentTS);
        return user;
    }

    function obtainRemainingTimeout(user, currentTS, period, limit) {
        return Math.round((user.ts + period * 1000 - currentTS)/ 1000)
    }

    return {
        canUserMakeRequest,
        updateUserRequest,
        createNewUserRequest,
        obtainRemainingTimeout
    }

}