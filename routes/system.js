var express = require('express');
var nconf = require('nconf');
var router = express.Router();

/* GET System info */
router.get('/', function(req, res, next) {
    var version = app_name;
    res.type('json');
    var latest = getLastVersion();
    res.send(
        {"id": version, "apiversion": 1});
});

module.exports = router;
