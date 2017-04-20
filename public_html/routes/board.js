var commons = require('../config/common');
var menus = require('../config/menu');
var basic = require('../config/basic');
var config = require('../config/secret.js');
var express = require('express');

var router = express.Router();
var common = commons();


/*********************************************
 * MySQL
**********************************************/
var mysql = require('mysql');
var sqlPool = mysql.createPool({
     connectionLimit: 3,
     host: config.sql.host,
     user: config.sql.user,
     database: config.sql.database,
     password: config.sql.password
});

/* GET Board - Default */
router.get('/', function(req, res, next) {
     res.redirect('/board/play/list');
});
/* GET Board - List */
//http://devlecture.tistory.com/entry/06-express-%EB%B3%B8%EA%B2%A9-%EA%B2%8C%EC%8B%9C%ED%8C%90-%EC%BD%94%EB%94%A9-13
router.get(['/:bid', '/:bid/list'], function(req, res, next) {
     /*pool.getConnection(function (err, connection) {
          var q = "SELECT idx FROM ";
          connection.query(q, function (err, rows) {
               if (err)  console.error("Error: " + err);
               console.log("rows: " + JSON.stringify(rows));

               res.render(req.params.bid, {rows: rows});
               connection.release();
          });
     });*/
     var loginstate = common.getUserState(req);
     common.activeMenu(menus, req.params.bid);
     res.render(req.params.bid, {
          title: basic.HOMEPAGE_TITLE,
          bUrl: basic.HOMEPAGE_URL,
          menudata: menus,
          loginState: loginstate
     });
});
/* GET Board - Write */
router.get('/:bid/write', function(req, res, next) {
     var loginstate = common.getUserState(req);
     common.activeMenu(menus, req.params.bid);
     res.render('_write', {
          title: basic.HOMEPAGE_TITLE,
          bUrl: basic.HOMEPAGE_URL,
          menudata: menus,
          loginState: loginstate
     });
});

module.exports = router;
