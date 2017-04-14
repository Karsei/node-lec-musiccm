module.exports = {
     'secret': '',
     'db_info': {
          local: {
               //
          },
          real: {
               //
          },
          dev: {
               //
          }
     },
     'federation': {
          'naver': {
               'client_id': '',
               'secret_id': '',
               'callback_url': '/auth/login/naver/callback'
          },
          'facebook': {
               'client_id': '',
               'secret_id': '',
               'callback_url': '/auth/login/facebook/callback'
          },
          'kakao': {
               'client_id': '',
               'callback_url': '/auth/login/kakao/callback'
          }
     }
}
