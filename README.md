# scraping-service

The app receives `url`, makes request (connecting to proxy server) to it to retrieve `html` and `headers`.</br>

Steps:
1. app establishes connection with a proxy server, then performs the request
2. if connection was not established, app retries using different proxy
3. step `2` repeats until the retries limit is reached - in this case, it returns `500` error
4. for each connection attempt, `ip` gets set to `Redis` for `1` second
    1. this is done to prevent making too many connection requests to the same proxy

## Tech Stack

- [Express.js](https://expressjs.com/)
- [Redis](https://redis.io/)

## Installation

Create `.env` file (inside the root directory) and copy variables from `.env.example` to `.env`.

Then run following command:

```bash
# install dependencies
$ npm install
```

[Install](https://redis.io/docs/getting-started/installation/) Redis for your OS.

## Running the app

```bash
# development
$ npm run start

# start redis service (you should have it installed locally)
$ redis-server
```

When application is up and running, make request to `http://localhost:3000?url=https://www.google.com`.<br />
You should receive `body` (html) and `headers`.
