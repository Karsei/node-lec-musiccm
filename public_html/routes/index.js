var express = require('express');
var router = express.Router();

/*********************************************
 * DEFAULT VARIABLES
**********************************************/
var HOMEPAGE_TITLE = "DASHBOARD";

/* GET - Home */
router.get('/', function(req, res, next) {
     res.render('index', { title: HOMEPAGE_TITLE });
});
router.get('/index', function(req, res, next) {
     res.render('index', { title: HOMEPAGE_TITLE });
});
/* GET - About */
router.get('/about', function(req, res, next) {
     res.render('about', { title: HOMEPAGE_TITLE });
});
/* GET - Play */
router.get('/play', function(req, res, next) {
     res.render('play', { title: HOMEPAGE_TITLE });
});
/* GET - Mentor */
router.get('/mentor', function(req, res, next) {
     res.render('mentor', { title: HOMEPAGE_TITLE });
});
/* GET - Sheet */
router.get('/sheet', function(req, res, next) {
     res.render('sheet', { title: HOMEPAGE_TITLE });
});

module.exports = router;
