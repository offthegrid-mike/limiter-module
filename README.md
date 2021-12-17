# Rate Limiter 
Rate Limiter is a module to monitor the request from users, and deny users making considerable amount of request within a period.

# Requirements
The module is developed under the following platform
* mac OS 10.5.7
* [Node.js v16.13.0](https://nodejs.org/en/)

# Installation
Clone this repo to your local machine using CLI or any git softwares
```
git clone https://github.com/offthegrid-mike/limiter-module.git
```

cd to repo folder and install required dependencies if needed
```
npm install
```

Run unit tests
```
npm run test
```

# Run application
cd to repo folder, run the following code in terminal
```
node app.js
```
Terminal will return  `Rate Limiter listening at http://localhost:3000`

open web browser and navigate to http://localhost:3000 will return  `Please pass a correct API Key`

In order to complete a request, need to pass a URL parameters with key `key` to indicate unique user requests with API key (e.g.: `http://localhost:3000/?key=APIKey`

In order to mimic 100 requests within an hour, can refresh 100 times or ask terminal to help you.
```
for i in {1..100}
do
curl http://localhost:3000/?key=APIKey
done
```

Using web browser to request the 101st using same API key, will return
`Rate limit exceeded. Try again in #${s} seconds`

Using other API key can still access successfully

# Modified parameters
Number of limit, restriction period and decision algorithm can be modified `limit`, `period` and `strategy` parameters in `app.js`
* limit: integer
* period: integer (second)
* strategy: Object

For decision algorithm, need to implement the following four functions and design a user value for storage use
```
* user: user detail which is designed with respect to the strategy
* currentTS: current request timestamp
* period: time window to restrict request
* limit: number of request that user can make
```

### canUserMakeRequest(user, currentTS, period, limit)
```
Usage: to determine user can make request this time
Return: boolean
```

### updataeUserRequest(user, currentTS, period, limit)
```
Usage: to update user detail for this request
Return: boolean
```

### createNewUserRequest(currentTS, period, limit)
```
Usage: to create first time request user detail
Return: User detail object
```

### obtainRemainingTimeout(user, currentTS, period, limit)
```
Usage: to calculate user timeout until next allowed request in second
Return: integer
```

# Unit testing
Simply call `mocha` to help you run the unit test and you can enjoy your coffee

# Futher progress and insight
- The storage unit is currently volatile (aka in memory only, data can only retain in program life cycle), it would be better to adapt different storage module to support disk storage, like [keyDB](https://keydb.dev/), [redis](https://redis.io/) or relational databases(e.g.: MYSQL or PostgreSQL)

- The current algorithm is using second as time unit to compare difference, since timestamp round up from millisecond will lost precision, revised to prevent rounding is better

- Always feel energetic when design and build modules that can allow others to use and rely on!
