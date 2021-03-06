
var express = require('express');
var router = express.Router();
var telescope = require(__dirname);

router.get('/', (req, res, next) => {
    var page = {
        page: req.query.page || 0,
        limit: req.query.limit || 3
    }
    return telescope.all(page)
        .then((result) => {
            res.status(result.statusCode).json(result.body);
        })
        .catch((err) => {
            console.log(err)
            next(err);
        });
});

router.get('/count', (req, res, next) => {
    return telescope.count()
        .then((result) => {
            res.status(result.statusCode).json(result.body);
        })
        .catch((err) => {
            next(err);
        });
});

router.get('/id/:id', (req, res, next) => {
    return telescope.byId(req.params.id)
        .then((result) => {
            res.status(result.statusCode).json(result.body);
        })
        .catch((err) => {
            next(err);
        });
});

router.get('/:name', (req, res, next) => {
    return telescope.byName(req.params.name)
        .then((result) => {
            res.status(result.statusCode).json(result.body);
        })
        .catch((err) => {
            next(err);
        });
});

router.post('/', (req, res, next) => {
    return telescope.create(req.body)
        .then((result) => {
            res.status(result.statusCode).json(result.body);
        })
        .catch((err) => {
            next(err);
        });
});

router.put('/', (req, res, next) => {
    return telescope.updateByName(req.body)
        .then((result) => {
            res.status(result.statusCode).json(result.body);
        })
        .catch((err) => {
            next(err);
        });
});

router.delete('/:id', (req, res, next) => {
    return telescope.deleteById(req.params.id)
        .then((result) => {
            res.status(result.statusCode).json(result.body);
        })
        .catch((err) => {
            next(err);
        });
});

module.exports = router;