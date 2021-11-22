import express from 'express';
import {userStorage} from './storage.js'
import {rateLimiter} from './rateLimiter.js'
import {requestAlgorithm} from './requestAlgorithm.js'

const app = express();
const port = 3000;

const limit = 10;
const period = 10;

const storage = new userStorage();
const strategy = new requestAlgorithm(storage, limit, period);
const limiter = new rateLimiter(storage, strategy, limit, period);


app.get('/', (req, res) => {
  if (!req.query.key ||
      !req.query.key === "") {
      res.status(400).send("Please pass a correct API Key");
  }
  else {
    const APIKey = req.query.key;

    limiter.process(APIKey, res);
  }
})

app.listen(port, () => {
  console.log(`Rate Limiter listening at http://localhost:${port}`)
})
