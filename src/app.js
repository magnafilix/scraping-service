const createError = require('http-errors');
const express = require('express');

const routes = require('./routes')

const router = express.Router()

routes(router)

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/', router)

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: err
  });
});

module.exports = app;
