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
               'client_id': 'EYLUzQM0k_ZoddYsPr97',
               'secret_id': '88cKQcCZg5',
               'callback_url': '/auth/login/naver/callback'
          },
          'facebook': {
               'client_id': '1324170261032318',
               'secret_id': 'dc766c8d4c934276643c43d9f0e913a8',
               'callback_url': '/auth/login/facebook/callback'
          }
     },
     'sql': {
          'host': 'localhost',
          'user': 'musiccm',
          'database': 'musiccm',
          'password': 'musiccmpass'
     }
}
