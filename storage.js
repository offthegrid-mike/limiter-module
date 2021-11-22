export function userStorage() {
    // map API key to object
    const userMap = new Map();

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
        userMap // For unit test only
    }
}