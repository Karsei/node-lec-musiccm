var commons = require('../config/common');
var menus = require('../config/menu');
var basic = require('../config/basic');
var express = require('express');

var router = express.Router();
var common = commons();


/*********************************************
 * DEFAULT VARIABLES
**********************************************/
/* GET - Home */
router.get('/', function(req, res, next) {
     var loginstate = common.getUserState(req);
     if (loginstate)
          res.redirect('/' + common.findMenuIndexToName(menus, basic.HOMEPAGE_MAIN_INDEX));
     else
          res.redirect('/index');
});
router.get('/index', function(req, res, next) {
     var loginstate = common.getUserState(req);
     common.activeMenu(menus, "index");
     res.render('index', {
          title: basic.HOMEPAGE_TITLE,
          bUrl: basic.HOMEPAGE_URL,
          menudata: menus,
          loginState: loginstate
     });
});
/* GET - About */
router.get('/about', function(req, res, next) {
     var loginstate = common.getUserState(req);
     common.activeMenu(menus, "about");
     res.render('about', {
          title: basic.HOMEPAGE_TITLE,
          bUrl: basic.HOMEPAGE_URL,
          menudata: menus,
          loginState: loginstate
     });
});
/* GET - Play */
router.get('/play', function(req, res, next) {
     var loginstate = common.getUserState(req);
     common.activeMenu(menus, "play");
     res.render('play', {
          title: basic.HOMEPAGE_TITLE,
          bUrl: basic.HOMEPAGE_URL,
          menudata: menus,
          loginState: loginstate
     });
});
/* GET - Mentor */
router.get('/mentor', function(req, res, next) {
     var loginstate = common.getUserState(req);
     common.activeMenu(menus, "mentor");
     res.render('mentor', {
          title: basic.HOMEPAGE_TITLE,
          bUrl: basic.HOMEPAGE_URL,
          menudata: menus,
          loginState: loginstate
     });
});
/* GET - Sheet */
router.get('/sheet', function(req, res, next) {
     var loginstate = common.getUserState(req);
     common.activeMenu(menus, "sheet");
     res.render('sheet', {
          title: basic.HOMEPAGE_TITLE,
          bUrl: basic.HOMEPAGE_URL,
          menudata: menus,
          loginState: loginstate
     });
});
/* GET - Mypage */
router.get('/mypage', function(req, res, next) {
     var loginstate = common.getUserState(req);
     var loginContent = "";
     if (loginstate) {
          loginContent = JSON.stringify(req.user._json);
     }
     res.render('mypage', {
          title: basic.HOMEPAGE_TITLE,
          bUrl: basic.HOMEPAGE_URL,
          loginState: loginContent
     });
});

module.exports = router;
