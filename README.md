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

cd to repo foler and install required dependencies if needed
```
npm install
```

Install necessary module for unit testing
```
npm install mocha
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
Number of limit and restriction period can be modified `limit` and `period` parameters in `app.js`
* limit: integer
* period: integer (second)

# Unit testing
Simply call `mocha` to help you run the unit test and you can enjoy your coffee
