# scraping-service

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