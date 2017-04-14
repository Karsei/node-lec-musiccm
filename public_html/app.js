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
var KakaoStrategy = require('passport-kakao').Strategy;

var index = require('./routes/index');
var users = require('./routes/users');
var board = require('./routes/board');


/*********************************************
 * OAuth 2.0 with PASSPORT.js
**********************************************/
passport.serializeUser(function (user, done) {
     done(null, user);
});
passport.deserializeUser(function (obj, done) {
     done(null, obj);
});
/*passport.use(new NaverStrategy({
          clientID: config.federation.naver.client_id,
          clientSecret: config.federation.naver.secret_id,
          callbackURL: config.federation.naver.callback_url,

          passReqToCallback: true
     }, function(request, accessToken, refreshToken, profile, done) {
          process.nextTick(function () {
               var _profile = profile._json;

               console.log(" - ACCESS TOKEN: " + accessToken);
               console.log(" - REFRESH TOKEN: " + refreshToken);
               return done(null, profile);
          });
     }
));
passport.use(new KakaoStrategy({
          clientID: config.federation.kakao.client_id,
          callbackURL: config.federation.kakao.callback_url,

          passReqToCallback: true
     }, function(request, accessToken, refreshToken, profile, done) {
          process.nextTick(function () {
               var _profile = profile._json;

               console.log(" - ACCESS TOKEN: " + accessToken);
               console.log(" - REFRESH TOKEN: " + refreshToken);
               return done(null, profile);
          });
          //User.findOrCreate({
          //     userId: profile.id
          //     }, function (err, user) {
          //          return done(err, user);
          //     }
          //);
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

               console.log(" - ACCESS TOKEN: " + accessToken);
               console.log(" - REFRESH TOKEN: " + refreshToken);
               return done(null, profile);
          });
     }
));*/

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
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
// Passport - Kakao 연동
app.get('/auth/login/kakao',
     passport.authenticate('kakao')
);
app.get('/auth/login/kakao/callback',
     passport.authenticate('kakao', {
          //successRedirect: '/',
          failureRedirect: '/'
     }), function (req, res) {
          res.redirect('/');
     }
);


app.use('/', index);
app.use('/users', users);
app.use('/board', board);

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
