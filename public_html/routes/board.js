var commons = require('../config/common');
var menus = require('../config/menu');
var basic = require('../config/basic');
var config = require('../config/secret.js');
var url = require('url');
var express = require('express');
var striptags = require('striptags');

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
     res.redirect('/board/play/list/1');
});
router.get('/:bid', function(req, res, next) {
     res.redirect('/board/' + req.params.bid + '/list/1');
});
router.get('/:bid/list', function(req, res, next) {
     res.redirect('/board/' + req.params.bid + '/list/1');
});
/* GET Board - List */
//http://devlecture.tistory.com/entry/06-express-%EB%B3%B8%EA%B2%A9-%EA%B2%8C%EC%8B%9C%ED%8C%90-%EC%BD%94%EB%94%A9-13
//router.get(['/:bid', '/:bid/list/:number'], function(req, res, next) {
router.get('/:bid/list/:number', function(req, res, next) {
     // GET 쿼리 가져오기
     var url_parts = url.parse(req.url, true);
     var url_query = url_parts.query;

     // 데이터베이스 id 가져오기
     var cateid = getCategoryId(req.params.bid)
       , brdid = getBoardId(req.params.bid);

     // 게시판 목록
     var board_Paging = {
          SHOW_COUNT: 10,
          PAGE_CURRENT: parseInt(req.params.number),
          PAGE_START: 0,
          PAGE_END: 0,
          TOTAL_ROW: 0,
          TOTAL_PAGE: 0
     };

     sqlPool.getConnection(function (err, connection) {
          var board_data, board_category;
          var q;

          // 게시판 정보 로드
          q = "SELECT * FROM mc_boardinfo " +
              "WHERE identify = '" + req.params.bid + "'";
          connection.query(q, function (binfoerr, binforows) {
               if (binfoerr)  console.error("Error: " + binfoerr);

               if (binforows.length == 1) {
                    // 카테고리 내용 받아오기
                    if (cateid != "") {
                         q = "SELECT * FROM " + cateid;
                         connection.query(q, function (cgerr, cgrows) {
                              if (cgerr)  console.error("Error: " + cgerr);
                              //console.log("(Board Category) rows: " + JSON.stringify(cgrows));

                              board_category = cgrows;

                              // 전체 갯수 가져오기
                              q = "SELECT count(*) AS TOTALCOUNT " +
                                  "FROM " + brdid + " AS BOARD, " + cateid + " AS CATE, mc_users AS USERLIST " +
                                  "WHERE (BOARD.category = CATE.id) AND (USERLIST.id = BOARD.user) " + ((url_query.category != undefined) ? ((url_query.category != "1") ? "AND (BOARD.category = " + url_query.category + ") " : " ") : " ");
                              connection.query(q, function (totalerr, totalrows) {
                                   if (totalerr)  console.error("Error: " + totalerr);

                                   // 전체 페이지 레코드 갯수와 페이지 구하기
                                   if (totalrows.length > 0) {
                                        board_Paging.TOTAL_ROW = totalrows[0].TOTALCOUNT;
                                        board_Paging.TOTAL_PAGE = Math.floor(board_Paging.TOTAL_ROW / board_Paging.SHOW_COUNT);
                                        if (board_Paging.TOTAL_ROW % board_Paging.SHOW_COUNT > 0) {
                                             board_Paging.TOTAL_PAGE = board_Paging.TOTAL_PAGE + 1;
                                        }
                                        // 페이지 보정
                                        if (board_Paging.TOTAL_ROW != 0 && board_Paging.TOTAL_PAGE < board_Paging.PAGE_CURRENT) {
                                             board_Paging.PAGE_CURRENT = board_Paging.TOTAL_PAGE;
                                        }
                                        // 시작과 끝 페이지 계산
                                        board_Paging.PAGE_START = ((board_Paging.PAGE_CURRENT - 1) / board_Paging.SHOW_COUNT) * board_Paging.SHOW_COUNT + 1;
                                        board_Paging.PAGE_END = board_Paging.PAGE_START + board_Paging.SHOW_COUNT - 1;
                                        // 끝 페이지 보정
                                        if (board_Paging.PAGE_END > board_Paging.TOTAL_PAGE) {
                                             board_Paging.PAGE_END = board_Paging.TOTAL_PAGE;
                                        }
                                        /*
                                        console.log("TOTAL_ROW: " + board_Paging.TOTAL_ROW);
                                        console.log("SHOW_COUNT: " + board_Paging.SHOW_COUNT);
                                        console.log("PAGE_CURRENT: " + board_Paging.PAGE_CURRENT);
                                        console.log("TOTAL_PAGE: " + board_Paging.TOTAL_PAGE);
                                        console.log("PAGE_START: " + board_Paging.PAGE_START);
                                        console.log("PAGE_END: " + board_Paging.PAGE_END);
                                        */
                                        // 게시판 목록 가져오기
                                        q = "SELECT " + getSelectQuery(req.params.bid) + " " +
                                            "FROM " + brdid + " AS BOARD, " + cateid + " AS CATE, mc_users AS USERLIST " +
                                            "WHERE (BOARD.category = CATE.id) AND (USERLIST.id = BOARD.user) " + ((url_query.category != undefined) ? ((url_query.category != "1") ? "AND (BOARD.category = " + url_query.category + ") " : " ") : " ") +
                                            "ORDER BY BOARD.id DESC " +
                                            "LIMIT " + (board_Paging.PAGE_START - 1) + ", " + (board_Paging.PAGE_START + board_Paging.SHOW_COUNT - 1) + ";";
                                        connection.query(q, function (bderr, bdrows) {
                                             if (bderr)  console.error("Error: " + bderr);
                                             //console.log("(Board Data) rows: " + JSON.stringify(bdrows));

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
                                                  boardInfo: binforows[0],
                                                  boardData: board_data,
                                                  boardCategory: board_category,
                                                  boardPaging: board_Paging,
                                                  striptags: striptags
                                             });

                                             // 연결 해제
                                             connection.release();
                                        });
                                   } else {
                                        console.error("ERROR - NO TOTAL COUNT");
                                   }
                              });
                         });
                    } else {
                         // 전체 갯수 가져오기
                         q = "SELECT count(*) AS TOTALCOUNT " +
                             "FROM " + brdid + " AS BOARD, mc_users AS USERLIST " +
                             "WHERE (BOARD.user = USERLIST.id)";
                         connection.query(q, function (totalerr, totalrows) {
                              if (bderr)  console.error("Error: " + bderr);

                              // 전체 페이지 레코드 갯수와 페이지 구하기
                              board_Paging.TOTAL_ROW = totalrows[0].TOTALCOUNT;
                              board_Paging.TOTAL_PAGE = Math.floor(board_Paging.TOTAL_ROW / board_Paging.SHOW_COUNT);
                              if (board_Paging.TOTAL_ROW % board_Paging.SHOW_COUNT > 0) {
                                   board_Paging.TOTAL_PAGE = board_Paging.TOTAL_PAGE + 1;
                              }
                              // 페이지 보정
                              if (board_Paging.TOTAL_ROW != 0 && board_Paging.TOTAL_PAGE < board_Paging.PAGE_CURRENT) {
                                   board_Paging.PAGE_CURRENT = board_Paging.TOTAL_PAGE;
                              }
                              // 시작과 끝 페이지 계산
                              board_Paging.PAGE_START = ((board_Paging.PAGE_CURRENT - 1) / board_Paging.SHOW_COUNT) * board_Paging.SHOW_COUNT + 1;
                              board_Paging.PAGE_END = board_Paging.PAGE_START + board_Paging.SHOW_COUNT - 1;
                              // 끝 페이지 보정
                              if (board_Paging.PAGE_END > board_Paging.TOTAL_PAGE) {
                                   board_Paging.PAGE_END = board_Paging.TOTAL_PAGE;
                              }

                              // 게시판 목록 가져오기
                              q = "SELECT " + getSelectQuery(req.params.bid) + " " +
                                  "FROM " + brdid + " AS BOARD, mc_users AS USERLIST " +
                                  "WHERE (BOARD.user = USERLIST.id) "
                                  "ORDER BY BOARD.id DESC " +
                                  "LIMIT " + (board_Paging.PAGE_START - 1) + ", " + (board_Paging.PAGE_START + board_Paging.SHOW_COUNT - 1) + ";";
                              connection.query(q, function (bcerr, bcrows) {
                                   if (bcerr)  console.error("Error: " + bcerr);
                                   //console.log("(Board Data) rows: " + JSON.stringify(bcrows));

                                   // 로그인 상태 파악 후 메뉴 구성
                                   var loginstate = common.getUserState(req);
                                   common.activeMenu(menus, req.params.bid);

                                   // 페이지 출력
                                   res.render(req.params.bid, {
                                        title: basic.HOMEPAGE_TITLE,
                                        bUrl: basic.HOMEPAGE_URL,
                                        menudata: menus,
                                        loginState: loginstate,
                                        boardInfo: binforows[0],
                                        boardData: board_data,
                                        boardCategory: board_category,
                                        boardPaging: board_Paging,
                                        striptags: striptags
                                   });

                                   connection.release();
                              });
                         });
                    }
               }
          });
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
               connection.query(q, function (cgerr, cgrows) {
                    if (cgerr)  console.error("Error: " + cgerr);
                    //console.log("(Board Category) rows: " + JSON.stringify(cgrows));

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
/* POST Board - Write OK */
router.post('/:bid/writeok', function(req, res, next) {
     // 데이터베이스 id 가져오기
     var cateid = getCategoryId(req.params.bid)
       , brdid = getBoardId(req.params.bid);

     // 게시판에 삽입
     sqlPool.getConnection(function (err, connection) {
          var q;

          if (cateid != "") {
               console.log("게시판: " + brdid + ", 카테고리 있음 - " + cateid);
               switch (req.params.bid) {
                    case "sheet":
                         q = "INSERT INTO musiccm." + brdid + "(`user`, `title`, `content`, `category`) VALUES ('" + req.user.cmid + "', '" + req.body.writeInpTitle + "', '" + req.body.writeInpContent + "', '" + req.body.writeInpCate + "');";
                    break;
                    case "play":
                         q = "INSERT INTO musiccm." + brdid + "(`user`, `title`, `youtubeurl`, `content`, `category`) VALUES ('" + req.user.cmid + "', '" + req.body.writeInpTitle + "', '" + req.body.writeYoutubeURL + "', '" + req.body.writeInpContent + "', '" + req.body.writeInpCate + "');";
                    break;
               }
          } else {
               console.log("게시판: " + brdid + ", 카테고리 없음 - " + cateid);
               q = "INSERT INTO musiccm." + brdid + "(`user`, `title`, `content`) VALUES ('" + req.user.cmid + "', '" + req.body.writeInpTitle + "', '" + req.body.writeInpContent + "');";
          }
          connection.query(q, function (cgerr, cgrows) {
               if (cgerr)  console.error("Error: " + cgerr);
               //console.log("(Board Write) rows: " + JSON.stringify(cgrows));

               // 연결 해제
               connection.release();

               // 원래 목록으로 되돌아감
               res.redirect('/board/' + req.params.bid + '/list/1');
          });
     });
});

/* GET Board - view */
router.get('/:bid/view/:number', function(req, res, next) {
     // 데이터베이스 id 가져오기
     var cateid = getCategoryId(req.params.bid)
       , brdid = getBoardId(req.params.bid);

     // 글 정보 로드
     sqlPool.getConnection(function (err, connection) {
          var board_data, board_category;
          var q;

          // 게시판 정보 로드
          q = "SELECT * FROM mc_boardinfo " +
              "WHERE identify = '" + req.params.bid + "'";
          connection.query(q, function (binfoerr, binforows) {
               if (binfoerr)  console.error("Error: " + binfoerr);

               if (binforows.length == 1) {
                    if (cateid != "") {
                         q = "SELECT * FROM " + cateid;
                         connection.query(q, function (cgerr, cgrows) {
                              if (cgerr)  console.error("Error: " + cgerr);
                              //console.log("(Board Category) rows: " + JSON.stringify(cgrows));

                              board_category = cgrows;

                              // 게시판 목록 가져오기
                              q = "SELECT " + getSelectQuery(req.params.bid) + " " +
                                  "FROM " + brdid + " AS BOARD, " + cateid + " AS CATE, mc_users AS USERLIST " +
                                  "WHERE (BOARD.category = CATE.id) AND (USERLIST.id = BOARD.user) AND (BOARD.id = " + req.params.number + ") ";
                              connection.query(q, function (aerr, arows) {
                                   if (aerr)  console.error("Error: " + aerr);
                                   console.log("(Board View) rows: " + JSON.stringify(cgrows));

                                   board_data = arows;

                                   // 조회수 증가
                                   q = "UPDATE " + brdid + " AS BOARD " +
                                       "SET BOARD.view = BOARD.view+1 " +
                                       "WHERE (BOARD.id = " + req.params.number + ");";
                                   connection.query(q, function (vuerr, vurows) {
                                        if (vuerr)  console.error("Error: " + vuerr);
                                   });

                                   // 로그인 상태 파악 후 메뉴 구성
                                   var loginstate = common.getUserState(req);
                                   common.activeMenu(menus, req.params.bid);

                                   // 페이지 출력
                                   res.render('_view', {
                                        title: basic.HOMEPAGE_TITLE,
                                        bUrl: basic.HOMEPAGE_URL,
                                        menudata: menus,
                                        loginState: loginstate,
                                        bid: req.params.bid,
                                        boardInfo: binforows[0],
                                        boardCategory: board_category,
                                        boardData: board_data
                                   });

                                   // 연결 해제
                                   connection.release();
                              });
                         });
                    } else {
                         // 로그인 상태 파악 후 메뉴 구성
                         var loginstate = common.getUserState(req);
                         common.activeMenu(menus, req.params.bid);

                         // 페이지 출력
                         res.render('_view', {
                              title: basic.HOMEPAGE_TITLE,
                              bUrl: basic.HOMEPAGE_URL,
                              menudata: menus,
                              loginState: loginstate,
                              bid: req.params.bid,
                              boardInfo: binforows[0],
                              boardCategory: board_category
                         });

                         // 연결 해제
                         connection.release();
                    }
               }
          });
     });
});

function getSelectQuery(bid) {
     switch (bid) {
          case "sheet":
               return "BOARD.id AS a_id, BOARD.user AS a_user, BOARD.title AS a_title, BOARD.content AS a_content, BOARD.adate AS a_date, BOARD.view AS a_view, BOARD.like AS a_like, BOARD.heart AS a_heart, BOARD.category AS a_category, USERLIST.id AS u_id, USERLIST.aid AS u_aid, USERLIST.nickname AS u_nickname, CATE.name AS c_name";
          break;
          case "play":
               return "BOARD.id AS a_id, BOARD.user AS a_user, BOARD.title AS a_title, BOARD.content AS a_content, BOARD.adate AS a_date, BOARD.view AS a_view, BOARD.category AS a_category, USERLIST.id AS u_id, USERLIST.aid AS u_aid, USERLIST.nickname AS u_nickname, CATE.name AS c_name";
          default:
               return "*";
          break;
     }
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
