# scraping-service

## Tech Stack

- [Express.js](https://expressjs.com/)
- [Redis](https://redis.io/)

## Installation

Create `.env` file (inside the root directory) and copy variables from `.env.example` to `.env`.

Then run following commands:

```bash
# install dependencies
$ npm install

# start redis service (you should have it up and runnning locally)
$ redis-server
```

## Running the app

```bash
# development
$ npm run start
```