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
     sqlPool.getConnection(function (err, connection) {
          var board_data, board_category;

          // 게시판 내용 받아오기
          var q = "SELECT * FROM mc_playboard AS BOARD, mc_bcategory AS CATE WHERE CATE.boardtype = '0' AND (BOARD.pcategory = CATE.categoryid) ORDER BY BOARD.id DESC;";
          connection.query(q, function (err, bdrows) {
               if (err)  console.error("Error: " + err);
               console.log("(Board Data) rows: " + JSON.stringify(bdrows));
               board_data = bdrows;

               // 게시판 카테고리 받아오기
               q = "SELECT categoryid, name FROM mc_bcategory WHERE boardtype = '0';";
               connection.query(q, function (err, bcrows) {
                    if (err)  console.error("Error: " + err);
                    console.log("(Board Category) rows: " + JSON.stringify(bcrows));
                    board_category = bcrows;

                    // 로그인 상태 파악 후 메뉴 구성
                    var loginstate = common.getUserState(req);
                    common.activeMenu(menus, req.params.bid);

                    // 페이지 출력
                    res.render(req.params.bid, {
                         title: basic.HOMEPAGE_TITLE,
                         bUrl: basic.HOMEPAGE_URL,
                         menudata: menus,
                         loginState: loginstate,
                         boardData: board_data,
                         boardCategory: board_category
                    });

                    connection.release();
               });
          });
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
