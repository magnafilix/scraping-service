# scraping-service

The application receives a `url`, makes a request (by connecting to a proxy server) for `html` and `headers`.

Steps:
1. the application establishes a connection to the proxy server, then executes the request
2. if the connection was not established, the application tries again using a different proxy
3. step `2` is repeated until the retry limit is reached - in which case a `500` error is returned
4. for each connection attempt `ip` is set to `redis` for `1` second
    1. this is to prevent too many connection requests to the same proxy

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
