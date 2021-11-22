import express from 'express';
import {userStorage} from './storage.js'
import {rateLimiter} from './rateLimiter.js'

const app = express();
const port = 3000;

const limit = 100;
const period = 60*60;

const storage = new userStorage();
const limiter = new rateLimiter(storage, limit, period);

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
