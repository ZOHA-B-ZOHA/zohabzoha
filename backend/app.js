const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const cors = require('cors');

const indexRouter = require('./routes/index');

const app = express();
app.set('port', process.env.PORT || 3000);

// const corsOption = {
//   origin: "",
//   credentials: true
// }
app.use(cors());

app.use(session({
  secret: 'zohabzoha!',
    resave: false,
    saveUninitialized: true,
    store: new FileStore({logFn: function(){}}),
    cookie: {
        // 나중에 true로 바꾸기
        httpOnly: false,
        secure: false,
        maxAge: 1200000
    }
}))

// vue js router 연동
app.use(require('connect-history-api-fallback')());

require('console-stamp')(console, 'yyyy/mm/dd HH:MM:ss.l');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//http.createServer(app).listen(app.get('port'), () => {
//	console.log('express server start')
//});

app.listen(3000, console.log('express server running!'));

module.exports = app;
