var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var config = require('./config/secret.js');

// PASSPORT
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var NaverStrategy = require('passport-naver').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;

// Google
var google = require('googleapis');

// MySQL
var mysql = require('mysql');

// ROUTES
var index = require('./routes/index');
var users = require('./routes/users');
var board = require('./routes/board');
var service = require('./routes/service');

/*********************************************
 * Google APIs
**********************************************/
google.options({
     auth: config.google.api_key
});

/*********************************************
 * MySQL Connection
**********************************************/
var sqlPool = mysql.createPool({
     connectionLimit: 3,
     host: config.sql.host,
     user: config.sql.user,
     database: config.sql.database,
     password: config.sql.password
});

/*********************************************
 * OAuth 2.0 with PASSPORT.js
**********************************************/
passport.serializeUser(function (user, done) {
     done(null, user);
});
passport.deserializeUser(function (obj, done) {
     done(null, obj);
});
passport.use('local-signin', new LocalStrategy({
          usernameField: 'signInpEmail',
          passwordField: 'signInpPassword',
          passReqToCallback: true
     }, function(req, email, password, done) {
          process.nextTick(function () {
               sqlPool.getConnection(function (err, connection) {
                    if (err)  console.error("Error: " + err);

                    // 기존 유저 정보 가져오기
                    var q;
                    q = "SELECT * FROM mc_users WHERE (aid = '" + email + "') AND (password = PASSWORD('" + password + "'));";
                    connection.query(q, function (err2, bdrows) {
                         if (err2)  console.error("Error: " + err2);

                         if (bdrows.length == 1) {
                              var profile = {
                                   id: email,
                                   displayName: bdrows[0].nickname,
                                   cmid: bdrows[0].id,
                                   method: bdrows[0].method
                              };

                              // 이미 등럭된 유저
                              console.log("기존 유저임");

                              // 연결 해제
                              connection.release();
                              return done(null, profile);
                         } else {
                              // 잘못된 데이터베이스
                              console.log("데이터 없거나 비밀번호가 다름");

                              // 연결 해제
                              connection.release();
                              return done(null, false, { message: "등록된 아이디가 없거나 비밀번호가 다릅니다." });
                         }
                    });
               });
          });
     }
));
passport.use(new NaverStrategy({
          clientID: config.federation.naver.client_id,
          clientSecret: config.federation.naver.secret_id,
          callbackURL: config.federation.naver.callback_url,

          passReqToCallback: true
     }, function(request, accessToken, refreshToken, profile, done) {
          process.nextTick(function () {
               sqlPool.getConnection(function (err, connection) {
                    if (err)  console.error("Error: " + err);

                    // 기존 유저 정보 가져오기
                    var q;
                    q = "SELECT * FROM mc_users WHERE aid = '" + profile.id + "';";
                    connection.query(q, function (err2, bdrows) {
                         if (err2)  console.error("Error: " + err2);

                         if (bdrows.length < 1) {
                              // 기존에 등록된 유저가 없으면 데이터 추가
                              q = "INSERT INTO mc_users(`aid`, `nickname`, `method`) VALUES('" + profile.id + "', '" + profile.displayName + "', '1');";
                              connection.query(q, function (err3, isurows) {
                                   if (err3)  console.error("Error: " + err3);

                                   // 등록 고유 ID 가져오기
                                   var q;
                                   q = "SELECT * FROM mc_users WHERE aid = '" + profile.id + "';";
                                   connection.query(q, function (err4, idrows) {
                                        if (err4)  console.error("Error: " + err4);

                                        profile.cmid = idrows[0].id;
                                        profile.method = idrows[0].method;

                                        console.log("유저 추가됨");

                                        // 연결 해제
                                        connection.release();

                                        console.log(" - [NAVER] ACCESS TOKEN: " + accessToken);
                                        console.log(" - [NAVER] REFRESH TOKEN: " + refreshToken);
                                        return done(null, profile);
                                   });
                              });
                         } else if (bdrows.length == 1) {
                              // 이미 등럭된 유저
                              console.log("기존 유저임");

                              profile.cmid = bdrows[0].id;
                              profile.method = bdrows[0].method;

                              // 연결 해제
                              connection.release();

                              console.log(" - [NAVER] ACCESS TOKEN: " + accessToken);
                              console.log(" - [NAVER] REFRESH TOKEN: " + refreshToken);
                              return done(null, profile);
                         } else {
                              // 잘못된 데이터베이스
                              console.log("잘못된 정보");

                              // 연결 해제
                              connection.release();
                              return done(null, false, { message: "잘못된 정보입니다." });
                         }
                    });
               });
          });
     }
));
passport.use(new FacebookStrategy({
          clientID: config.federation.facebook.client_id,
          clientSecret: config.federation.facebook.secret_id,
          callbackURL: config.federation.facebook.callback_url,

          passReqToCallback: true
     }, function(request, accessToken, refreshToken, profile, done) {
          // 비동기로 코드 진행
          process.nextTick(function () {
               var _profile = profile._json;

               sqlPool.getConnection(function (err, connection) {
                    if (err)  console.error("Error: " + err);

                    // 기존 유저 정보 가져오기
                    var q;
                    q = "SELECT * FROM mc_users WHERE aid = '" + profile.id + "';";
                    connection.query(q, function (err2, bdrows) {
                         if (err2)  console.error("Error: " + err2);

                         if (bdrows.length < 1) {
                              // 기존에 등록된 유저가 없으면 데이터 추가
                              q = "INSERT INTO mc_users(`aid`, `nickname`, `method`) VALUES('" + profile.id + "', '" + profile.name + "', '2');";
                              connection.query(q, function (err3, isurows) {
                                   if (err3)  console.error("Error: " + err3);

                                   // 등록 고유 ID 가져오기
                                   var q;
                                   q = "SELECT * FROM mc_users WHERE aid = '" + profile.id + "';";
                                   connection.query(q, function (err4, idrows) {
                                        if (err4)  console.error("Error: " + err4);

                                        profile.cmid = idrows[0].id;
                                        profile.method = idrows[0].method;

                                        console.log("유저 추가됨");

                                        // 연결 해제
                                        connection.release();

                                        console.log(" - [Facebook] ACCESS TOKEN: " + accessToken);
                                        console.log(" - [Facebook] REFRESH TOKEN: " + refreshToken);
                                        return done(null, profile);
                                   });
                              });
                         } else if (bdrows.length == 1) {
                              // 이미 등럭된 유저
                              console.log("기존 유저임");

                              profile.cmid = bdrows[0].id;
                              profile.method = bdrows[0].method;

                              // 연결 해제
                              connection.release();

                              console.log(" - [Facebook] ACCESS TOKEN: " + accessToken);
                              console.log(" - [Facebook] REFRESH TOKEN: " + refreshToken);
                              return done(null, profile);
                         } else {
                              // 잘못된 데이터베이스
                              console.log("잘못된 정보");

                              // 연결 해제
                              connection.release();
                              return done(null, false, { message: "잘못된 정보입니다." });
                         }
                    });
               });
          });
     }
));

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({ limit: '10mb', parameterLimit: 1000000 }));
app.use(bodyParser.urlencoded({ extended: false, limit: '10mb', parameterLimit: 1000000 }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Passport 모듈 - 세션 다루기
app.use(session({
          secret: 'keyboard cat',
          resave: true,
          saveUninitialized: true
     })
);
// Passport 모듈 - 활성
app.use(passport.initialize());
app.use(passport.session());

// Passport - Local
// https://scotch.io/tutorials/easy-node-authentication-setup-and-local
app.post('/auth/signin',
     passport.authenticate('local-signin', {
          successRedirect: '/',
          failureRedirect: '/auth/signin/error'
          //failureFlash: true
     }), function (req, res) {
          res.redirect('/');
     }
);
app.get('/auth/signin/error', function (req, res) {
     res.send("<script>alert('아이디가 없거나 비밀번호가 잘못되었습니다.'); history.back();</script>");
});
app.post('/auth/signup', function(req, res, next) {
     sqlPool.getConnection(function (err, connection) {
          if (err)  console.error("Error: " + err);

          // 기존 유저 정보 가져오기
          var q;
          q = "SELECT * FROM mc_users WHERE aid = '" + req.body.signInpEmail + "';";
          connection.query(q, function (err2, bdrows) {
               if (err2)  console.error("Error: " + err2);

               if (bdrows.length < 1) {
                    // 기존에 등록된 유저가 없으면 데이터 추가
                    q = "INSERT INTO mc_users(`aid`, `nickname`, `method`, `password`) VALUES('" + req.body.signInpEmail + "', '" + ((req.body.signInpEmail).split('@'))[0] + "', '3', PASSWORD('" + req.body.signInpPassword + "'));";
                    connection.query(q, function (err3, isurows) {
                         if (err3)  console.error("Error: " + err3);

                         // 연결 해제
                         connection.release();
                         res.send("<script>alert('정상적으로 가입되었습니다!\n다시 로그인을 시도하세요.'); history.back();</script>");
                    });
               } else if (bdrows.length == 1) {
                    // 이미 등럭된 유저
                    console.log("기존 유저임");

                    // 연결 해제
                    connection.release();
                    res.send("<script>alert('이미 등록된 유저입니다!\n다른 아이디로 시도해보세요.'); history.back();</script>");
               } else {
                    // 잘못된 데이터베이스
                    console.log("잘못된 정보");
                    // 연결 해제
                    connection.release();
                    res.send("<script>alert('잘못된 접근입니다.'); history.back();</script>");
               }
          });
     });
});

// Passport - Naver 연동
// https://cheese10yun.github.io/passport-thirdpart-loginl
app.get('/auth/login/naver',
     passport.authenticate('naver')
);
app.get('/auth/login/naver/callback',
     passport.authenticate('naver', {
          //successRedirect: '/',
          failureRedirect: '/'
     }), function (req, res) {
          res.redirect('/');
     }
);
// Passport - Facebook 연동
app.get('/auth/login/facebook',
     passport.authenticate('facebook')
);
app.get('/auth/login/facebook/callback',
     passport.authenticate('facebook', {
          //successRedirect: '/',
          failureRedirect: '/'
     }), function (req, res) {
          res.redirect('/');
     }
);
// 로그아웃
app.get('/logout', function (req, res) {
     req.logout();
     res.redirect('/');
});


app.use('/', index);
app.use('/users', users);
app.use('/board', board);
app.use('/service', service);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
     var err = new Error('Not Found');
     err.status = 404;
     next(err);
});

// error handler
app.use(function(err, req, res, next) {
     // set locals, only providing error in development
     res.locals.message = err.message;
     res.locals.error = req.app.get('env') === 'development' ? err : {};

     // render the error page
     res.status(err.status || 500);
     res.render('error');
});

module.exports = app;
