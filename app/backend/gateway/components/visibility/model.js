var path = require('path');
var config = require(path.join(__dirname, '../../config/', (process.env.NODE_ENV || 'development')));
var http = require('http');
var CircuitBreaker = require(path.join(__dirname, "../../utilities/circuitBreaker"));
var queue = require(path.join(__dirname, '../../utilities/queue'));
var logger = require(path.join(__dirname, '../../utilities/logger'));

var visibilityCircuitBreaker = new CircuitBreaker(5, 10000, "Visibility", () => {
    queue.get("visibility")
        .then(reqs => {
            var reqs = reqs.map(({ telescopeid }) => deleteVisibilityByTelescopeid(telescopeid).catch(err => logger.error(err)));
        })
        .catch(err => logger.error(err));
});

var opt = {
    host: '127.0.0.1',
    port: config.visibility.port,
    agent: false,
    headers: {
        'Content-Type': 'application/json',
        'Transfer-Encoding': 'chunked'
    }
}

function httpRequest(opt, resolve, reject, request_data) {
    var req = http.request(opt, (res) => {
        var body = [];

        res.on('data', (chunk) => {
            body.push(chunk);
        });

        res.on('end', () => {
            try {
                if (res.statusCode === 401) {
                    return resolve(res);
                }
                if (body.length)
                    body = JSON.parse(Buffer.concat(body).toString());
            } catch (err) {
                let error = {
                    statusCode: 424,
                    body: {
                        err: {
                            message: "Ошибка парсинга тела ответа от Visibility.",
                            detail: err
                        }
                    }
                }
                reject(error);
            }

            res.body = body;
            resolve(res);
        });
    });

    req.on('error', (err) => {
        let error = {
            statusCode: 424,
            body: {
                err: {
                    message: "Visibility не отвечает.",
                    detail: err
                }
            }
        }
        reject(error);
    });

    if (request_data) {
        req.write(JSON.stringify(request_data));
    }

    req.end();
}

function httpRequestWithCircuitBreaker(opt, resolve, reject, object) {
    return visibilityCircuitBreaker.call(res => { visibilityCircuitBreaker.log(); resolve(res) },
        err => { visibilityCircuitBreaker.log(); reject(err) }, () => new Promise((res, rej) => httpRequest(opt, res, rej, object)));
}

var token = null;
var basicHeader = 'Basic ' + Buffer.from('telescopes:123456').toString('base64');
function auth(opt, resolve, reject, object) {
    if (token) {
        opt.headers["Authorization"] = `Bearer ${token.value}`;
    }
    return httpRequestWithCircuitBreaker(opt, res => {
        if (res.statusCode === 401) {
            var authOpt = {
                host: '127.0.0.1',
                port: config.visibility.port,
                agent: false,
                headers: {
                    'Content-Type': 'application/json',
                    'Transfer-Encoding': 'chunked',
                    'Authorization': basicHeader
                },
                method: 'GET',
                path: '/api/v1/token'
            };
            console.log(1);
            httpRequest(authOpt, res => {
                if (res.statusCode != 200) {
                    return reject({
                        statusCode: 501,
                        body: {
                            err: {
                                message: "Can't get token.",
                            }
                        }
                    })
                } else {
                    token = res.body;
                    opt.headers["Authorization"] = `Bearer ${token.value}`;
                    return httpRequestWithCircuitBreaker(opt, resolve, reject, object);
                }
            }, reject, object)
        } else {
            resolve(res);
        }
    }, reject, object)
}

function createVisibility(visibility) {
    return new Promise((resolve, reject) => {
        opt.method = 'POST';
        opt.path = '/api/v1/';
        auth(opt, resolve, reject, visibility);
    });
}

function findById(id) {
    return new Promise((resolve, reject) => {
        opt.method = 'GET';
        opt.path = '/api/v1/' + id;
        auth(opt, resolve, reject);
    });
}

function findAll(page) {
    return new Promise((resolve, reject) => {
        opt.method = 'GET';
        opt.path = '/api/v1/?page=' + page.page + '&limit=' + page.limit;
        auth(opt, resolve, reject);
    });
}

function count() {
    return new Promise((resolve, reject) => {
        opt.method = 'GET';
        opt.path = '/api/v1/count';
        auth(opt, resolve, reject);
    });
}

function deleteVisibility(id) {
    return new Promise((resolve, reject) => {
        opt.method = 'DELETE';
        opt.path = '/api/v1/' + id;
        auth(opt, resolve, reject);
    });
}

function deleteVisibilityByObjectid(id) {
    return new Promise((resolve, reject) => {
        opt.method = 'DELETE';
        opt.path = '/api/v1/objectid/' + id;
        auth(opt, resolve, reject);
    });
}

function deleteVisibilityByTelescopeid(id) {
    return new Promise((resolve, reject) => {
        opt.method = 'DELETE';
        opt.path = '/api/v1/telescopeid/' + id;
        auth(opt, resolve, reject);
    });
}

module.exports = {
    createVisibility,
    deleteVisibility,
    deleteVisibilityByObjectid,
    deleteVisibilityByTelescopeid,
    findAll,
    count,
    findById
};