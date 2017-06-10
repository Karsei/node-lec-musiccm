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
     // 데이터베이스 id 가져오기
     var cateid = getCategoryId(req.params.bid)
       , brdid = getBoardId(req.params.bid);

     sqlPool.getConnection(function (err, connection) {
          var board_data, board_category;
          var q;

          // 카테고리 내용 받아오기
          if (cateid != "") {
               q = "SELECT * FROM " + cateid;
               connection.query(q, function (err, cgrows) {
                    if (err)  console.error("Error: " + err);
                    console.log("(Board Category) rows: " + JSON.stringify(cgrows));

                    board_category = cgrows;

                    // 게시판 목록 가져오기
                    q = "SELECT * FROM " + brdid + " AS BOARD, " + cateid + " AS CATE WHERE (BOARD.category = CATE.id) ORDER BY BOARD.id DESC;";
                    connection.query(q, function (err, bdrows) {
                         if (err)  console.error("Error: " + err);
                         console.log("(Board Data) rows: " + JSON.stringify(bdrows));

                         board_data = bdrows;

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
          } else {
               // 게시판 목록 가져오기
               q = "SELECT * FROM " + brdid + " ORDER BY BOARD.id DESC;";
               connection.query(q, function (err, bcrows) {
                    if (err)  console.error("Error: " + err);
                    console.log("(Board Data) rows: " + JSON.stringify(bcrows));

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
          }
     });
});
/* GET Board - Write */
router.get('/:bid/write', function(req, res, next) {
     // 데이터베이스 id 가져오기
     var cateid = getCategoryId(req.params.bid)
       , brdid = getBoardId(req.params.bid);

     sqlPool.getConnection(function (err, connection) {
          var board_category;

          // 카테고리 내용 받아오기
          if (cateid != "") {
               q = "SELECT * FROM " + cateid;
               connection.query(q, function (err, cgrows) {
                    if (err)  console.error("Error: " + err);
                    console.log("(Board Category) rows: " + JSON.stringify(cgrows));

                    board_category = cgrows;

                    // 로그인 상태 파악 후 메뉴 구성
                    var loginstate = common.getUserState(req);
                    common.activeMenu(menus, req.params.bid);

                    // 페이지 출력
                    res.render('_write', {
                         title: basic.HOMEPAGE_TITLE,
                         bUrl: basic.HOMEPAGE_URL,
                         menudata: menus,
                         loginState: loginstate,
                         bid: req.params.bid,
                         boardCategory: board_category
                    });

                    // 연결 해제
                    connection.release();
               });
          } else {
               // 로그인 상태 파악 후 메뉴 구성
               var loginstate = common.getUserState(req);
               common.activeMenu(menus, req.params.bid);

               // 페이지 출력
               res.render('_write', {
                    title: basic.HOMEPAGE_TITLE,
                    bUrl: basic.HOMEPAGE_URL,
                    menudata: menus,
                    loginState: loginstate,
                    bid: req.params.bid,
                    boardCategory: board_category
               });

               // 연결 해제
               connection.release();
          }
     });
});
/* GET Board - Write */
router.get('/:bid/write/writeok', function(req, res, next) {
     // 데이터베이스 id 가져오기
     var cateid = getCategoryId(req.params.bid)
       , brdid = getBoardId(req.params.bid);

     // 게시판에 삽입
     sqlPool.getConnection(function (err, connection) {
          var q;

          q = "INSERT INTO musiccm." + brdid + "(`user`, `title`, `content`) VALUES ('', '" + req.params.writeInpTitle + "', '" + req.params.writeInpContent + "');";
          connection.query(q, function (err, cgrows) {
               if (err)  console.error("Error: " + err);
               console.log("(Board Write) rows: " + JSON.stringify(cgrows));

               // 연결 해제
               connection.release();

               res.redirect('/board/' + req.params.bid + '/list');
          });
     });
}

function getCategoryId(bid) {
     switch (bid) {
          case "play":
               return "mc_cate_play"
          break;
          case "sheet":
               return "mc_cate_sheet";
          break;
          default:
               return "";
          break;
     }
}

function getBoardId(bid) {
     switch (bid) {
          case "play":
               return "mc_playboard";
          break;
          case "sheet":
               return "mc_sheetboard";
          break;
          case "mentor":
               return "mc_mentorboard";
          default:
               return "";
          break;
     }
}

module.exports = router;
