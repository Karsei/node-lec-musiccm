var config = require('../config/secret.js');
var express = require('express');
var router = express.Router();

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
     res.render(req.params.bid);
});
/* GET Board - Write */
router.get('/:bid/write', function(req, res, next) {
     res.render('_write');
});

module.exports = router;
