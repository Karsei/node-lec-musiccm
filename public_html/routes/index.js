var express = require('express');
var router = express.Router();


/*********************************************
 * Custom Functions
*********************************************/
/**
 * 메뉴에서 현재 보고 있는 페이지 선택 및 초기화
 * @param menudata        메뉴 데이터
 * @param name            활성되기를 원하는 이름
***/
function activeMenu(menudata, name) {
     if (menudata) {
          for (var i = 0; i < menudata.items.length; i++) {
               if (menudata.items[i].href == name)
                    menudata.items[i].selected = "active";
               else
                    menudata.items[i].selected = "";
          }
     }
}

/**
 * 요청값에서 유저의 세션 유지 확인
 * @param reqUser         요청값
 * @return 세션 유지가 되어 있다면 true, 아니면 false 반환
***/
function getUserState(reqUser) {
     if (reqUser.user) return true;
     else              return false;
}

/**
 * 메뉴 데이터에서 특정 인덱스의 이름을 출력
 * @param menudata        메뉴 데이터
 * @param index           원하는 인덱스
 * @return 특정 인덱스의 메뉴 이름 반환, 없으면 NULL 반환
***/
function findMenuIndexToName(menudata, index) {
     for (var i = 0; i < menudata.items.length; i++) {
          if (index == i)
          return menudata.items[i].href;
     }
     return NULL;
}

/*********************************************
 * DEFAULT VARIABLES
**********************************************/
var HOMEPAGE_TITLE = "MUSICCM";
var HOMEPAGE_MAIN_INDEX = 0;
var menus = {
     "items": [
          {
               "value": "홈",
               "href": "index",
               "selected": "",
               "isSubmenu": false,
               "parentMenu": ""
          },
          {
               "value": "소개",
               "href": "about",
               "selected": "",
               "isSubmenu": false,
               "parentMenu": ""
          },
          {
               "value": "커뮤니티",
               "href": "community",
               "selected": "",
               "isSubmenu": true,
               "parentMenu": ""
          },
          {
               "value": "연주 게시판",
               "href": "play",
               "selected": "",
               "isSubmenu": true,
               "parentMenu": "커뮤니티"
          },
          {
               "value": "멘토 게시판",
               "href": "mentor",
               "selected": "",
               "isSubmenu": true,
               "parentMenu": "커뮤니티"
          },
          {
               "value": "악보 게시판",
               "href": "sheet",
               "selected": "",
               "isSubmenu": true,
               "parentMenu": "커뮤니티"
          },
          {
               "value": "ENDSUB",
               "href": "ENDSUB",
               "selected": "",
               "isSubmenu": true,
               "parentMenu": "ENDSUB"
          }
     ]
};


/* GET - Home */
router.get('/', function(req, res, next) {
     var loginstate = getUserState(req);
     if (loginstate)
          res.redirect('/' + findMenuIndexToName(menus, HOMEPAGE_MAIN_INDEX));
     else
          res.redirect('/index');
});
router.get('/index', function(req, res, next) {
     var loginstate = getUserState(req);
     activeMenu(menus, "index");
     res.render('index', {
          title: HOMEPAGE_TITLE,
          menudata: menus,
          loginState: loginstate
     });
});
/* GET - About */
router.get('/about', function(req, res, next) {
     var loginstate = getUserState(req);
     activeMenu(menus, "about");
     res.render('about', {
          title: HOMEPAGE_TITLE,
          menudata: menus,
          loginState: loginstate
     });
});
/* GET - Play */
router.get('/play', function(req, res, next) {
     var loginstate = getUserState(req);
     activeMenu(menus, "play");
     res.render('play', {
          title: HOMEPAGE_TITLE,
          menudata: menus,
          loginState: loginstate
     });
});
/* GET - Mentor */
router.get('/mentor', function(req, res, next) {
     var loginstate = getUserState(req);
     activeMenu(menus, "mentor");
     res.render('mentor', {
          title: HOMEPAGE_TITLE,
          menudata: menus,
          loginState: loginstate
     });
});
/* GET - Sheet */
router.get('/sheet', function(req, res, next) {
     var loginstate = getUserState(req);
     activeMenu(menus, "sheet");
     res.render('sheet', {
          title: HOMEPAGE_TITLE,
          menudata: menus,
          loginState: loginstate
     });
});
/* GET - Mypage */
router.get('/mypage', function(req, res, next) {
     var loginstate = getUserState(req);
     var loginContent = "";
     if (loginstate) {
          loginContent = JSON.stringify(req.user._json);
     }
     res.render('mypage', {
          title: HOMEPAGE_TITLE,
          loginState: loginContent
     });
});

module.exports = router;
