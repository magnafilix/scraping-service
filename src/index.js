const debug = require('debug')('scraping-service:server');
const http = require('http');
const cluster = require("cluster");
const totalCPUs = require("os").cpus().length;
require('dotenv').config()

const app = require('./app');
const redisService = require('./services/redis')
const normalizePort = require('./helpers/normalize-port')

if (cluster.isMaster) {
  console.log(`Number of CPUs is ${totalCPUs}`);
  console.log(`Master ${process.pid} is running`);

  for (let i = 0; i < totalCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    console.log(`Let's fork another worker!`);
    cluster.fork();
  });
} else {
  const port = normalizePort(process.env.PORT || '3000');

  app.set('port', port);

  const server = http.createServer(app);
  console.log(`Worker ${process.pid} started`);

  server.listen(port);

  server.on('error', (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;

    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  });

  server.on('listening', () => {
    redisService.init()
      .then(() => {
        console.log('Redis is running!');
      })
      .catch(err => {
        console.log('Failed to run Redis', err)
      });

    const addr = server.address();
    const bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    debug('Debug: Server is listening on ' + bind);
    console.info('Server is listening on ' + bind);
  });
}