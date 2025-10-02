// Load environment variables
require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const {client} = require('./modules/redisClient')

client.connect().then(() => {
  console.log('Redis connected');
}).catch(err => {
  console.error('Redis connection error:', err);
})

// MongoDB Connection

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-link';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
})


const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const adminRouter = require('./routes/admin');
const busRouter = require('./routes/bus');
const routeRouter = require('./routes/route');
const stationRouter = require('./routes/station');
const stopRouter = require('./routes/stop');
const driverRouter = require('./routes/driver');
const gpsRouter = require('./routes/gps');
const tripRouter = require('./routes/trip');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors({
  origin: "http://localhost:3001", // your frontend
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use('/api', indexRouter);
app.use('/users', usersRouter);
app.use('/admin', adminRouter);
app.use('/api/buses', busRouter);
app.use('/api/routes', routeRouter);
app.use('/api/stations', stationRouter);
app.use('/api/stops', stopRouter);
app.use('/api/drivers', driverRouter);
app.use('/api/gps', gpsRouter);
app.use('/api/trips', tripRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
