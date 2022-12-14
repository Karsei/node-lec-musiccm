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
 * Youtube
**********************************************/
var google = require('googleapis');
var youtube = google.youtube('v3');

var YoutubeData = function (obj) {};
YoutubeData.prototype = {
     /*****************************************************
      * [Youtube 특정 동영상의 정보를 가져옴]
      * @param callback            작업이 끝난 후 콜백 함수
      * @param param               필요 파라메터
      * core error 관련 ::
      https://developers.google.com/youtube/v3/docs/core_errors
     ******************************************************/
     getVideosList : function (callback, param) {
          try {
               /*
               [PART]
               id,snippet,contentDetails,fileDetails, liveStreamingDetails, player, processingDetails,recordingDetails,statistics,status,suggestions,topicDetails
               */
               var p_part = param.part;
               var p_id = param.id;
               if (p_part && p_id) {
                    youtube.videos.list({
                         part: p_part,
                         id: p_id
                    }, function(err, data) {
                         if (err) {
                              callback(err);
                              console.error(err);
                         }
                         if (data) {
                              callback(data);
                         }
                    });
               } else {
                    callback({
                         part: "Youtube Video List",
                         error: "Need parameter. Check server console and board.js."
                    });
               }
          } catch (e) {
               console.error(e);
          }
     },
     /*****************************************************
      * [Youtube 영상 주소의 고유 ID 추출]
      * @param url                 Youtube 영상 주소
      * @return Youtube 영상의 고유 ID
     ******************************************************/
     getVideoId: function (url) {
          var vid = url.split('v=')[1]
            , ampPos = vid.indexOf('&');
          if (ampPos != -1) {
               vid = vid.substring(0, ampPos);
          }
          return vid;
     }
};
var YoutubeAPI = new YoutubeData();


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
          SHOW_COUNT: 9,
          PAGE_CURRENT: parseInt(req.params.number),
          PAGE_START: 0,
          PAGE_END: 0,
          TOTAL_ROW: 0,
          TOTAL_PAGE: 0
     };

     try {
          sqlPool.getConnection(function (err, connection) {
               var board_data, board_category;
               var q;

               // 게시판 정보 로드
               q = "SELECT * FROM mc_boardinfo " +
                   "WHERE identify = '" + req.params.bid + "'";
               connection.query(q, function (binfoerr, binforows) {
                    if (binfoerr)  console.error("Error: " + binfoerr);

                    // 검색어가 있는 경우, 데이터베이스에 등록
                    if (url_query.search != undefined && url_query.search.length > 0) {
                         q = "INSERT INTO musiccm.mc_searchlist(`board`, `keyword`, `user`) VALUES ('" + brdid + "', '" + url_query.search + "', '" + ((req.user != undefined) ? req.user.cmid : "1") + "');";
                         connection.query(q, function (searcherr, searchrows) {
                              if (searcherr)  console.error("Error: " + searcherr);
                         });
                    }

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
                                       "WHERE (BOARD.category = CATE.id) " +
                                       "AND (USERLIST.id = BOARD.user) " +
                                       ((url_query.category != undefined) ? ((url_query.category != "1") ? "AND (BOARD.category = " + url_query.category + ") " : " ") : " ") +
                                       ((url_query.search != undefined) ? "AND (BOARD.title LIKE '%" + url_query.search + "%') " : " ") + ";";
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
                                             board_Paging.PAGE_START = Math.floor((board_Paging.PAGE_CURRENT - 1) / board_Paging.SHOW_COUNT) * board_Paging.SHOW_COUNT + 1;
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
                                                 "WHERE (BOARD.category = CATE.id) " +
                                                 "AND (USERLIST.id = BOARD.user) " +
                                                 ((url_query.category != undefined) ? ((url_query.category != "1") ? "AND (BOARD.category = " + url_query.category + ") " : " ") : " ") +
                                                 ((url_query.search != undefined) ? "AND (BOARD.title LIKE '%" + url_query.search + "%') " : " ") +
                                                 "ORDER BY BOARD.id DESC " +
                                                 "LIMIT " + ((board_Paging.PAGE_CURRENT - 1) * board_Paging.SHOW_COUNT) + ", " + board_Paging.SHOW_COUNT + ";";
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
                                                       queryCategory: (url_query.category != undefined) ? url_query.category : "1",
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
                                  "WHERE (BOARD.user = USERLIST.id) " +
                                  ((url_query.search != undefined) ? "AND (BOARD.title LIKE '%" + url_query.search + "%') " : " ");
                              connection.query(q, function (totalerr, totalrows) {
                                   if (totalerr)  console.error("Error: " + totalerr);

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
                                   switch (req.params.bid) {
                                        case "mentor":
                                             q = "SELECT " + getSelectQuery(req.params.bid) + " " +
                                                 "FROM " + brdid + " AS BOARD, mc_users AS USERLIST " +
                                                 "WHERE (BOARD.user = USERLIST.id) " +
                                                 ((url_query.search != undefined) ? "AND (BOARD.title LIKE '%" + url_query.search + "%') " : " ") +
                                                 "AND (BOARD.atype = 0) " +
                                                 "ORDER BY BOARD.replyid ASC, BOARD.adate ASC, BOARD.id DESC " +
                                                 "LIMIT " + ((board_Paging.PAGE_CURRENT - 1) * board_Paging.SHOW_COUNT) + ", " + board_Paging.SHOW_COUNT + ";";
                                             connection.query(q, function (bcerr, bcrows) {
                                                  if (bcerr)  console.error("Error: " + bcerr);
                                                  //console.log("(Board Data) rows: " + JSON.stringify(bcrows));

                                                  // 로그인 상태 파악 후 메뉴 구성
                                                  var loginstate = common.getUserState(req);
                                                  common.activeMenu(menus, req.params.bid);

                                                  board_data = bcrows;

                                                  // 페이지 출력
                                                  res.render(req.params.bid, {
                                                       title: basic.HOMEPAGE_TITLE,
                                                       bUrl: basic.HOMEPAGE_URL,
                                                       menudata: menus,
                                                       loginState: loginstate,
                                                       boardInfo: binforows[0],
                                                       boardData: board_data,
                                                       boardPaging: board_Paging,
                                                       striptags: striptags
                                                  });

                                                  connection.release();
                                             });
                                             break;
                                        case "notice":
                                             q = "SELECT " + getSelectQuery(req.params.bid) + " " +
                                                 "FROM " + brdid + " AS BOARD, mc_users AS USERLIST " +
                                                 "WHERE (BOARD.user = USERLIST.id) " +
                                                 ((url_query.search != undefined) ? "AND (BOARD.title LIKE '%" + url_query.search + "%') " : " ") +
                                                 "ORDER BY BOARD.id DESC " +
                                                 "LIMIT " + ((board_Paging.PAGE_CURRENT - 1) * board_Paging.SHOW_COUNT) + ", " + board_Paging.SHOW_COUNT + ";";
                                             connection.query(q, function (bcerr, bcrows) {
                                                  if (bcerr)  console.error("Error: " + bcerr);
                                                  //console.log("(Board Data) rows: " + JSON.stringify(bcrows));

                                                  // 로그인 상태 파악 후 메뉴 구성
                                                  var loginstate = common.getUserState(req);
                                                  common.activeMenu(menus, req.params.bid);

                                                  board_data = bcrows;

                                                  // 페이지 출력
                                                  res.render(req.params.bid, {
                                                       title: basic.HOMEPAGE_TITLE,
                                                       bUrl: basic.HOMEPAGE_URL,
                                                       menudata: menus,
                                                       loginState: loginstate,
                                                       boardInfo: binforows[0],
                                                       boardData: board_data,
                                                       boardPaging: board_Paging,
                                                       striptags: striptags
                                                  });

                                                  connection.release();
                                             });
                                             break;
                                   }
                              });
                         }
                    }
               });
          });
     } catch (e) {
          console.error(e);
     }
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

          switch (req.params.bid) {
               case "play":
                    // Youtube 영상의 썸네일 구하기
                    if (req.body.writeYoutubeURL != undefined || req.body.writeYoutubeURL != "") {
                         var setParam = {
                              part: "id,snippet",
                              id: YoutubeAPI.getVideoId(req.body.writeYoutubeURL)
                         };
                         YoutubeAPI.getVideosList(function (data) {
                              q = "INSERT INTO musiccm." + brdid + "(`user`, `title`, `youtubeid`, `youtubethum`, `content`, `category`) VALUES ('" +
                                  req.user.cmid + "', '" + req.body.writeInpTitle + "', '" + YoutubeAPI.getVideoId(req.body.writeYoutubeURL) + "', '" + data.items[0].snippet.thumbnails.default.url + "', '" + req.body.writeInpContent + "', '" + req.body.writeInpCate + "');";
                              console.log(q);
                              connection.query(q, function (cgerr, cgrows) {
                                   if (cgerr)  console.error("Error: " + cgerr);
                                   // 연결 해제
                                   connection.release();
                                   // 원래 목록으로 되돌아감
                                   res.redirect('/board/' + req.params.bid + '/list/1');
                              });
                         }, setParam);
                    }
               break;
               case "sheet":
                    q = "INSERT INTO musiccm." + brdid + "(`user`, `title`, `thumurl`, `content`, `category`) VALUES ('" + req.user.cmid + "', '" + req.body.writeInpTitle + "', '" + req.body.writeInpImg + "', '" + req.body.writeInpContent + "', '" + req.body.writeInpCate + "');";
                    connection.query(q, function (cgerr, cgrows) {
                         if (cgerr)  console.error("Error: " + cgerr);

                         // 연결 해제
                         connection.release();
                         // 원래 목록으로 되돌아감
                         res.redirect('/board/' + req.params.bid + '/list/1');
                    });
               break;
               case "mentor":
                    if (req.body.mentorInpType == "question") {
                         q = "INSERT INTO musiccm." + brdid + "(`user`, `title`, `content`, `atype`) VALUES ('" + req.user.cmid + "', '" + req.body.mentorInpContent + "', '" + req.body.mentorInpContent + "', '0');";
                         connection.query(q, function (cgerr, cgrows) {
                              if (cgerr)  console.error("Error: " + cgerr);

                              // 연결 해제
                              connection.release();
                              // 원래 목록으로 되돌아감
                              res.redirect('/board/' + req.params.bid + '/list/1');
                         });
                    } else if (req.body.mentorInpType == "answer") {
                         q = "INSERT INTO musiccm." + brdid + "(`user`, `title`, `content`, `atype`, `replyid`) VALUES ('" + req.user.cmid + "', '" + req.body.mentorInpAnsContent + "', '" + req.body.mentorInpAnsContent + "', '1', '" + req.body.mentorInpId + "');";
                         connection.query(q, function (cgerr, cgrows) {
                              if (cgerr)  console.error("Error: " + cgerr);

                              // 연결 해제
                              connection.release();
                              // 원래 목록으로 되돌아감
                              res.redirect('/board/' + req.params.bid + '/list/1');
                         });
                    } else if (req.body.mentorInpType == "reply") {
                         q = "INSERT INTO musiccm." + brdid + "(`user`, `title`, `content`, `atype`, `replyid`) VALUES ('" + req.user.cmid + "', '" + req.body.mentorInpReplyContent + "', '" + req.body.mentorInpReplyContent + "', '1', '" + req.body.mentorInpId + "');";
                         connection.query(q, function (cgerr, cgrows) {
                              if (cgerr)  console.error("Error: " + cgerr);

                              // 연결 해제
                              connection.release();
                              // 원래 목록으로 되돌아감
                              res.redirect('/board/' + req.params.bid + '/list/1');
                         });
                    }
               break;
          }
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
                                   //console.log("(Board View) rows: " + JSON.stringify(cgrows));

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
                                        loginUser: (req.user != undefined) ? req.user.cmid : 0,
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
                         // 게시판 목록 가져오기
                         q = "SELECT " + getSelectQuery(req.params.bid) + " " +
                             "FROM " + brdid + " AS BOARD, mc_users AS USERLIST " +
                             "WHERE (USERLIST.id = BOARD.user) AND (BOARD.id = " + req.params.number + ") ";
                         connection.query(q, function (aerr, arows) {
                              if (aerr)  console.error("Error: " + aerr);
                              //console.log("(Board View) rows: " + JSON.stringify(arows));

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
                                   loginUser: (req.user != undefined) ? req.user.cmid : 0,
                                   bid: req.params.bid,
                                   boardInfo: binforows[0],
                                   boardCategory: board_category,
                                   boardData: board_data
                              });

                              // 연결 해제
                              connection.release();
                         });
                    }
               }
          });
     });
});

/* GET Board - Modify */
router.get('/:bid/modify/:number', function(req, res, next) {
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

                    // 게시판 목록 가져오기
                    q = "SELECT " + getSelectQuery(req.params.bid) + " " +
                        "FROM " + brdid + " AS BOARD, " + cateid + " AS CATE, mc_users AS USERLIST " +
                        "WHERE (BOARD.category = CATE.id) " +
                        "AND (USERLIST.id = BOARD.user) " +
                        "AND BOARD.id = '" + req.params.number + "';";
                    connection.query(q, function (bderr, bdrows) {
                         if (bderr)  console.error("Error: " + bderr);
                         //console.log("(Board Data) rows: " + JSON.stringify(bdrows));

                         board_data = bdrows;

                         // 로그인 상태 파악 후 메뉴 구성
                         var loginstate = common.getUserState(req);
                         common.activeMenu(menus, req.params.bid);

                         // 페이지 출력
                         res.render('_modify', {
                              title: basic.HOMEPAGE_TITLE,
                              bUrl: basic.HOMEPAGE_URL,
                              menudata: menus,
                              loginState: loginstate,
                              bid: req.params.bid,
                              boardData: board_data,
                              boardCategory: board_category,
                              striptags: striptags
                         });

                         // 연결 해제
                         connection.release();
                    });
               });
          } else {
               // 게시판 목록 가져오기
               q = "SELECT " + getSelectQuery(req.params.bid) + " " +
                   "FROM " + brdid + " AS BOARD, mc_users AS USERLIST " +
                   "WHERE (USERLIST.id = BOARD.user) AND (BOARD.id = '" + req.params.number + "');";
               connection.query(q, function (bderr, bdrows) {
                    if (bderr)  console.error("Error: " + bderr);
                    //console.log("(Board Data) rows: " + JSON.stringify(bdrows));

                    board_data = bdrows;

                    // 로그인 상태 파악 후 메뉴 구성
                    var loginstate = common.getUserState(req);
                    common.activeMenu(menus, req.params.bid);

                    // 페이지 출력
                    res.render('_modify', {
                         title: basic.HOMEPAGE_TITLE,
                         bUrl: basic.HOMEPAGE_URL,
                         menudata: menus,
                         loginState: loginstate,
                         boardInfo: binforows[0],
                         boardData: board_data,
                         striptags: striptags
                    });

                    // 연결 해제
                    connection.release();
               });
          }
     });
});
/* POST Board - Modify OK */
router.post('/:bid/modifyok/:number', function(req, res, next) {
     // 데이터베이스 id 가져오기
     var cateid = getCategoryId(req.params.bid)
       , brdid = getBoardId(req.params.bid);

     // 게시판에 삽입
     sqlPool.getConnection(function (err, connection) {
          var q;

          switch (req.params.bid) {
               case "play":
                    // Youtube 영상의 썸네일 구하기
                    if (req.body.modifyYoutubeURL != undefined || req.body.modifyYoutubeURL != "") {
                         var setParam = {
                              part: "id,snippet",
                              id: YoutubeAPI.getVideoId(req.body.modifyYoutubeURL)
                         };
                         YoutubeAPI.getVideosList(function (data) {
                              q = "UPDATE musiccm." + brdid + " SET `title`='" + req.body.modifyInpTitle + "', `youtubeid`='" + YoutubeAPI.getVideoId(req.body.modifyYoutubeURL) + "', `youtubethum`='" + data.items[0].snippet.thumbnails.default.url + "', `content`='" + req.body.modifyInpContent + "', `category`='"+ req.body.writeInpCate + "' " +
                                  "WHERE `id`='" + req.params.number + "';";
                              connection.query(q, function (mderr, mdrows) {
                                   if (mderr)  console.error("Error: " + mderr);
                                   // 연결 해제
                                   connection.release();
                                   // 작성한 글로 되돌아감
                                   res.redirect('/board/' + req.body.modifyInpBid + '/view/' + req.params.number);
                              });
                         }, setParam);
                    }
               break;
               case "sheet":
                    q = "UPDATE musiccm." + brdid + " SET `title`='" + req.body.modifyInpTitle + "', `content`='" + req.body.modifyInpContent + "', `category`='"+ req.body.writeInpCate + "' " +
                        "WHERE `id`='" + req.params.number + "';";
                    connection.query(q, function (mderr, mdrows) {
                         if (mderr)  console.error("Error: " + mderr);

                         // 연결 해제
                         connection.release();
                         // 작성한 글로 되돌아감
                         res.redirect('/board/' + req.body.modifyInpBid + '/view/' + req.params.number);
                    });
               break;
               case "mentor":
                    q = "UPDATE musiccm." + brdid + " SET `title`='" + req.body.modifyInpTitle + "', `content`='" + req.body.modifyInpContent + "'" +
                        "WHERE `id`='" + req.params.number + "';";
                    connection.query(q, function (mderr, mdrows) {
                         if (mderr)  console.error("Error: " + mderr);

                         // 연결 해제
                         connection.release();
                         // 작성한 글로 되돌아감
                         res.redirect('/board/' + req.body.modifyInpBid + '/view/' + req.params.number);
                    });
               break;
          }
     });
});
/* GET Board - Delete */
router.get('/:bid/delete/:number', function(req, res, next) {
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

                    // 게시판 목록 가져오기
                    q = "SELECT " + getSelectQuery(req.params.bid) + " " +
                        "FROM " + brdid + " AS BOARD, " + cateid + " AS CATE, mc_users AS USERLIST " +
                        "WHERE (BOARD.category = CATE.id) " +
                        "AND (USERLIST.id = BOARD.user) " +
                        "AND BOARD.id = '" + req.params.number + "';";
                    connection.query(q, function (bderr, bdrows) {
                         if (bderr)  console.error("Error: " + bderr);
                         //console.log("(Board Data) rows: " + JSON.stringify(bdrows));

                         board_data = bdrows;

                         // 로그인 상태 파악 후 메뉴 구성
                         var loginstate = common.getUserState(req);
                         common.activeMenu(menus, req.params.bid);

                         // 페이지 출력
                         res.render('_delete', {
                              title: basic.HOMEPAGE_TITLE,
                              bUrl: basic.HOMEPAGE_URL,
                              menudata: menus,
                              loginState: loginstate,
                              bid: req.params.bid,
                              boardData: board_data,
                              boardCategory: board_category,
                              striptags: striptags
                         });

                         // 연결 해제
                         connection.release();
                    });
               });
          } else {
               // 게시판 목록 가져오기
               q = "SELECT " + getSelectQuery(req.params.bid) + " " +
                   "FROM " + brdid + " AS BOARD, mc_users AS USERLIST " +
                   "WHERE (USERLIST.id = BOARD.user) AND (BOARD.id = '" + req.params.number + "');";
               connection.query(q, function (bderr, bdrows) {
                    if (bderr)  console.error("Error: " + bderr);
                    //console.log("(Board Data) rows: " + JSON.stringify(bdrows));

                    board_data = bdrows;

                    // 로그인 상태 파악 후 메뉴 구성
                    var loginstate = common.getUserState(req);
                    common.activeMenu(menus, req.params.bid);

                    // 페이지 출력
                    res.render('_delete', {
                         title: basic.HOMEPAGE_TITLE,
                         bUrl: basic.HOMEPAGE_URL,
                         menudata: menus,
                         loginState: loginstate,
                         boardInfo: binforows[0],
                         boardData: board_data,
                         striptags: striptags
                    });

                    // 연결 해제
                    connection.release();
               });
          }
     });
});
/* POST Board - Delete OK */
router.post('/:bid/deleteok/:number', function(req, res, next) {
     // 데이터베이스 id 가져오기
     var cateid = getCategoryId(req.params.bid)
       , brdid = getBoardId(req.params.bid);

     // 게시판에 삽입
     sqlPool.getConnection(function (err, connection) {
          var q;

          switch (req.params.bid) {
               case "play":
                    q = "DELETE FROM musiccm." + brdid + " " +
                        "WHERE id='" + req.params.number + "';";
                    connection.query(q, function (delerr, delrows) {
                         if (delerr)  console.error("Error: " + delerr);
                         // 연결 해제
                         connection.release();
                         // 목록으로 되돌아감
                         res.redirect('/board/' + req.params.bid + '/list/');
                    });
               break;
               case "sheet":
                    q = "DELETE FROM musiccm." + brdid + " " +
                        "WHERE id='" + req.params.number + "';";
                    connection.query(q, function (delerr, delrows) {
                         if (delerr)  console.error("Error: " + delerr);
                         // 연결 해제
                         connection.release();
                         // 목록으로 되돌아감
                         res.redirect('/board/' + req.params.bid + '/list/');
                    });
               break;
               case "mentor":
                    q = "DELETE FROM musiccm." + brdid + " " +
                        "WHERE id='" + req.params.number + "';";
                    connection.query(q, function (delerr, delrows) {
                         if (delerr)  console.error("Error: " + delerr);
                         // 연결 해제
                         connection.release();
                         // 목록으로 되돌아감
                         res.redirect('/board/' + req.params.bid + '/list/');
                    });
               break;
          }
     });
});

/* POST Board - Keyword */
router.post('/getList', function(req, res, next) {
     if (req.body.query) {
          switch (req.body.query) {
               case "getIdList":
                    sqlPool.getConnection(function (err, connection) {
                         var q;
                         q = "SELECT " + getSelectQuery(req.body.bid) + " FROM musiccm." + req.body.brdid + " AS BOARD, musiccm.mc_users AS USERLIST " +
                             "WHERE (USERLIST.id = BOARD.user) " +
                             "ORDER BY BOARD.id DESC " +
                             "LIMIT " + req.body.startlist + "," + req.body.endlist + ";";
                         connection.query(q, function (searcherr, searchrows) {
                              if (searcherr)  console.error("Error: " + searcherr);
                              // 연결 해제
                              connection.release();
                              res.send(JSON.stringify(searchrows));
                         });
                    });
               break;
               case "getViewList":
                    sqlPool.getConnection(function (err, connection) {
                         var q;
                         q = "SELECT " + getSelectQuery(req.body.bid) + " FROM musiccm." + req.body.brdid + " AS BOARD, musiccm.mc_users AS USERLIST " +
                             "WHERE (USERLIST.id = BOARD.user) " +
                             "ORDER BY BOARD.view DESC " +
                             "LIMIT " + req.body.startlist + "," + req.body.endlist + ";";
                         connection.query(q, function (searcherr, searchrows) {
                              if (searcherr)  console.error("Error: " + searcherr);
                              // 연결 해제
                              connection.release();
                              res.send(JSON.stringify(searchrows));
                         });
                    });
               break;
          }
     }
});

/* POST Board - Keyword */
router.post('/keyword', function(req, res, next) {
     if (req.body.query) {
          switch (req.body.query) {
               case "getKeyword":
                    sqlPool.getConnection(function (err, connection) {
                         var q;
                         q = "SELECT * FROM musiccm.mc_searchlist " +
                             "ORDER BY id DESC;";
                         connection.query(q, function (searcherr, searchrows) {
                              if (searcherr)  console.error("Error: " + searcherr);
                              // 연결 해제
                              connection.release();
                              res.send(JSON.stringify(searchrows));
                         });
                    });
               break;
          }
     }
});

/* POST Board - Mentor-Reply */
router.post('/mentorreply', function(req, res, next) {
     if (req.body.query) {
          switch (req.body.query) {
               case "getReply":
                    sqlPool.getConnection(function (err, connection) {
                         var q;
                         q = "SELECT " + getSelectQuery("mentor") + " FROM musiccm.mc_mentorboard AS BOARD, musiccm.mc_users AS USERLIST " +
                             "WHERE (BOARD.user = USERLIST.id) AND (replyid = '" + req.body.a_id + "')" +
                             "ORDER BY adate ASC;";
                         connection.query(q, function (searcherr, searchrows) {
                              if (searcherr)  console.error("Error: " + searcherr);
                              // 연결 해제
                              connection.release();
                              res.send(JSON.stringify(searchrows));
                         });
                    });
               break;
          }
     }
});

function getSelectQuery(bid) {
     switch (bid) {
          case "sheet":
               return "BOARD.id AS a_id, BOARD.user AS a_user, BOARD.title AS a_title, BOARD.content AS a_content, BOARD.adate AS a_date, BOARD.view AS a_view, BOARD.like AS a_like, BOARD.heart AS a_heart, BOARD.category AS a_category, BOARD.thumurl AS a_thumurl, USERLIST.id AS u_id, USERLIST.aid AS u_aid, USERLIST.nickname AS u_nickname, CATE.name AS c_name";
               break;
          case "play":
               return "BOARD.id AS a_id, BOARD.user AS a_user, BOARD.title AS a_title, BOARD.content AS a_content, BOARD.adate AS a_date, BOARD.view AS a_view, BOARD.category AS a_category, BOARD.youtubeid AS a_youtubeid, BOARD.youtubethum AS a_youtubethum, USERLIST.id AS u_id, USERLIST.aid AS u_aid, USERLIST.nickname AS u_nickname, CATE.name AS c_name";
               break;
          case "play_nocate":
               return "BOARD.id AS a_id, BOARD.user AS a_user, BOARD.title AS a_title, BOARD.content AS a_content, BOARD.adate AS a_date, BOARD.view AS a_view, BOARD.youtubeid AS a_youtubeid, BOARD.youtubethum AS a_youtubethum, USERLIST.id AS u_id, USERLIST.aid AS u_aid, USERLIST.nickname AS u_nickname";
               break;
          case "mentor":
               return "BOARD.id AS a_id, BOARD.user AS a_user, BOARD.content AS a_content, BOARD.adate AS a_date, BOARD.atype AS a_type, BOARD.replyid AS a_replyid, USERLIST.id AS u_id, USERLIST.aid AS u_aid, USERLIST.nickname AS u_nickname";
               break;
          case "notice":
               return "BOARD.id AS a_id, BOARD.user AS a_user, BOARD.title AS a_title, BOARD.content AS a_content, BOARD.adate AS a_date, BOARD.view AS a_view, USERLIST.id AS u_id, USERLIST.aid AS u_aid, USERLIST.nickname AS u_nickname";
               break;
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
               break;
          case "notice":
               return "mc_noticeboard";
               break;
          default:
               return "";
          break;
     }
}

module.exports = router;
