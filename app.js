require('dotenv').config();

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');

// ROUTES FITUR SITI
var eventsRouter = require('./routes/events');
var committeesRouter = require('./routes/committees');
var exportsRouter = require('./routes/exports');
var apiSitiRouter = require('./routes/apiSiti');

const {
    notFoundHandler,
    errorHandler
} = require('./middlewares/error');

var app = express();


// ========================
// VIEW ENGINE
// ========================

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// ========================
// MIDDLEWARE
// ========================

app.use(logger('dev'));

app.use(express.json());

app.use(express.urlencoded({
    extended: false
}));

app.use(cookieParser());

app.use(express.static(
    path.join(__dirname, 'public')
));


// ========================
// SESSION
// ========================

const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

app.use(
    session({
        key: 'session_cookie_name',
        secret: process.env.SESSION_SECRET || 'secret',
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);


// ========================
// ROUTES
// ========================

app.use('/', indexRouter);

app.use('/users', usersRouter);

app.use('/admin', adminRouter);


// ===== FITUR SITI =====

app.use('/events', eventsRouter);

app.use('/committees', committeesRouter);

app.use('/exports', exportsRouter);

app.use('/api/siti', apiSitiRouter);


// ========================
// ERROR HANDLER
// ========================

app.use(notFoundHandler);

app.use(errorHandler);

module.exports = app;