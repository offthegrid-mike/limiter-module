export function userStorage() {
    // map API key to object
    const userMap = new Map();

    // factory for creating user detail object
    var userDetailFactory = {
        userDetail: function(ts) {
            this.ts = ts;
            this.attempt = 1; // on creation: first attempt
        }
    };

    function isExist(key) {
        return userMap.has(key);
    }

    function getValue(key) {
        return userMap.get(key);
    }

    function setValue(key, value) {
        userMap.set(key, value);
    }

    return {
        isExist, 
        getValue, 
        setValue,
        userDetailFactory,
        userMap // For unit test only
    }
}