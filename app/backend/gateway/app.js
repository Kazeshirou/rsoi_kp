var express = require('express');
var createError = require('http-errors');
var path = require('path');
var morgan = require('morgan');
var cors = require('cors');
var logger = require(path.join(__dirname, 'utilities/logger'));
var telescopeRouter = require(path.join(__dirname, 'components/telescopes/router'));
var visibilityRouter = require(path.join(__dirname, 'components/visibility/router'));
var objectRouter = require(path.join(__dirname, 'components/objects/router'));

var app = express();

app.use(cors());
app.use(morgan('combined', { stream: logger.stream }));

app.use(express.json());

app.use('/api/v1/telescopes', telescopeRouter);
app.use('/api/v1/objects', objectRouter);
app.use('/api/v1/visibility', visibilityRouter);

app.use((req, res, next) => {
    next(createError(404));
})

app.use(function (err, req, res, next) {
    var error;
    if (!err.status) {
        error = createError(501);
        error.detail = err;
    } else {
        error = err;
    }
    res.status(error.status);

    logger.info({ err: error });
    res.json({
        'err': error,
    });
})

module.exports = app;