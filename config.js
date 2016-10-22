exports.DATABASE_URL = process.env.DATABASE_URL || 
                       global.DATABASE_URL || 
                       (process.env.NODE_ENV === 'production' ? 
                       'mongodb://admin:admin@ds013946.mlab.com:13946/tic-tac-toe':
                       'mongodb://admin:admin@ds013946.mlab.com:13946/tic-tac-toe');
                       //'mongodb://localhost/tic-tac-toe' : 
                       //'mongodb://localhost/tic-tac-toe-dev');
exports.PORT = process.env.PORT || 8080;