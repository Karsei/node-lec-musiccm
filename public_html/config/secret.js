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
               'client_id': '____CLIENT_ID____',
               'secret_id': '____SECRET_ID____',
               'callback_url': '/auth/login/naver/callback'
          },
          'facebook': {
               'client_id': '____CLIENT_ID____',
               'secret_id': '____SECRET_ID____',
               'callback_url': '/auth/login/facebook/callback'
          }
     },
     'sql': {
          'host': 'localhost',
          'user': '____USER____',
          'database': '____DATABASE____',
          'password': '____PASSWORD____'
     },
     'google': {
          'api_key': '____API_KEY____'
     }
}
