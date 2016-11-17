global.DATABASE_URL = 'mongodb://admin:admin@ds013946.mlab.com:13946/tic-tac-toe';

var chai = require('chai');
var chaiHttp = require('chai-http');

var server = require('../server.js');

var should = chai.should();
var app = server.app;

var User = require('../user-model');

chai.use(chaiHttp);

describe('socket tic-tac-toe', function() {
    before(function(done) {
        server.runServer(function() {
            var user = new User({
                username: 'meng',
                password: 'password'
            });
            user.save(function(err) {
                if(err) console.log('unable add user');
                done();
            });
        });
    });
    
    it('log in', function(done) {
        User.findOne({
                username: 'meng'
            }, function(err, user) {
                should.equal(err, null);
                
                if(!user) {
                    console.log('user is ', user);
                }
                
                user.validatePassword('password', function(err, isValid) {
                    should.equal(err, null);
                    isValid.should.equal(true);
                    done();
                });
            });
    });
    
    after(function(done) {
        User.remove(function() {
            done();
        });
    });
});