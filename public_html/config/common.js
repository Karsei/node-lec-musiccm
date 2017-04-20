module.exports = function () {
     return {
          /**
           * 메뉴에서 현재 보고 있는 페이지 선택 및 초기화
           * @param menudata        메뉴 데이터
           * @param name            활성되기를 원하는 이름
          ***/
          activeMenu: function (menudata, name) {
               if (menudata) {
                    for (var i = 0; i < menudata.items.length; i++) {
                         if (menudata.items[i].href == name)
                              menudata.items[i].selected = "active";
                         else
                              menudata.items[i].selected = "";
                    }
               }
          },

          /**
           * 요청값에서 유저의 세션 유지 확인
           * @param reqUser         요청값
           * @return 세션 유지가 되어 있다면 true, 아니면 false 반환
          ***/
          getUserState: function (reqUser) {
               if (reqUser.user) return true;
               else              return false;
          },

          /**
           * 메뉴 데이터에서 특정 인덱스의 이름을 출력
           * @param menudata        메뉴 데이터
           * @param index           원하는 인덱스
           * @return 특정 인덱스의 메뉴 이름 반환, 없으면 NULL 반환
          ***/
          findMenuIndexToName: function (menudata, index) {
               for (var i = 0; i < menudata.items.length; i++) {
                    if (index == i)
                    return menudata.items[i].href;
               }
               return NULL;
          }

     };
}
