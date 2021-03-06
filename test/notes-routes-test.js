'use strict';

var Note = require('../model/note.js');
var User = require('../model/user.js');
var mocha = require('mocha');
var expect = require('chai').expect;
var chai = require('chai');
var chaihttp = require('chai-http');
var sa = require('superagent');
chai.use(chaihttp);

process.env.MONGOLAB_URI = "mongodb://localhost/notes_test";
var server = require('../server.js').listen(3000);
server.listen(3000);
var NOTES_APP_URL = 'localhost:3000';

describe('route/notes-routes.js', function(){
  
  // setup
  // get user with eat
  var eatToken;
  var note;
  before(function(done){
    if (!server.isRunning){
      server.listen(3000, function(){
        server.isRunning = true;
        console.log('Server is running on port 3000');
        done();
      });
    } else {
      done();
    }
   });

   before(function(done){
    sa.post('localhost:3000/api/user')
      .send({
        username:'testuser',
        email:'test@test.com',
        password:'dGVzdHBhc3N3b3Jk'
      })
      .end(function(err, res){
        eatToken = res.body.eatToken;
        done();
      });
  });
   
  // taredown
  after(function(done){
    Note.remove({}, function(err, data){
      if (err) console.log(err);
      User.remove({}, function(err, data){
      if (err) console.log(err);
        server.close(function(){
          server.isRunning = false;
          console.log('Server has shutdown');
          done();
        });;
      });
    });
  });

  // test
  describe('POST: /api/notes', function(){
    describe('with valid input', function(){
      var response;
      before(function(done){
        chai.request(NOTES_APP_URL)
          .post('/api/notes')
          .send({
            text: 'this be note text',
            eat: eatToken})
          .end(function(err, res){
            if (err) {
              console.log(err);
            }
              note = res.body.note;
              response = res;
              done();
        });
      });

      it('res.status should equal 200', function(){
        expect(response.status).to.eql(200);
      });

      it('res.body.success should equal true', function(){
        expect(response.body.success).to.eql(true); 
      });

      it('res.body.note.text should equal "this be note text"', function(){
        expect(response.body.note.text).to.eql('this be note text');
      });

      it('res.body.note.author should equal testuser', function(){
        expect(response.body.note.author).to.eql('testuser');
      });

      it('res.body.note should contain a propertie _id', function(){
        expect(!!response.body.note._id).to.eql(true);
      });

    });

    describe('with invalid eat', function(){
      var response;
      before(function(done){
          chai.request(NOTES_APP_URL)
            .post('/api/notes')
            .send({
              text: 'this be note text',
              eat: 'wat bad token'})
            .end(function(err, res){
                response = res;
                done();
          });
      });

      it('res.status should be 400', function(){
        expect(response.status).to.eql(401);
      });

      it('res.body.success should be false', function(){
        expect(response.body.success).to.eql(false);
      });

      it('res.body.err should be "UNAUTHORIZED: invalid eat token"', function(){
        expect(response.body.err).to.eql('UNAUTHORIZED: invalid eat token');
      });
    });
  });

  describe('GET /api/notes', function(){
    describe('with valid input', function(){
      var response;
      before(function(done){
        sa.get('localhost:3000/api/notes')
          .end(function(err, res){
            if (err) console.log(err);
            response = res;
            done();
          });
      });

      it('res.status should equal 200', function(){
        expect(response.status).to.eql(200);
      });
      
      it('res.body.notes should be an Array', function(){
        expect(Array.isArray(response.body.notes)).to.eql(true);
      });

      it('res.body.notes[0]._id should equal _id of original post response', function(){
        expect(response.body.notes[0]._id).to.eql(note._id);
      });

    });
  });

  describe('GET /api/notes/:id', function(){
    describe('with invalid id', function(){
      var response;
      before(function(done){
        sa.get('localhost:3000/api/notes/' + note._id + 'bad-id')
          .end(function(err, res){
            response = res;
            done();
          });
      });

      it('res.status should equal 400', function(){
        expect(response.status).to.eql(400);
      });  

      it('res.body.success should equal false', function(){
        expect(response.body.success).to.eql(false);
      });

      it('res.body.err should equal "BAD REQUEST: note not found"', function(){
        expect(response.body.err).to.eql("BAD REQUEST: note not found");
      });
    });

    describe('with valid input', function(){
      var response;
      before(function(done){
        sa.get('localhost:3000/api/notes/' + note._id)
          .end(function(err, res){
            if (err) console.log(err);
            response = res;
            done();
          });
      });

      it('res.status should equal 200', function(){
        expect(response.status).to.eql(200);
      });

      it('res.body.success should equal true', function(){
        expect(response.body.success).to.eql(true);
      });

      it('res.body.note._id should equal _id of original post response', function(){
        expect(response.body.note._id).to.eql(note._id);
      });
    });
  });

  describe('PUT /api/notes/:id', function(){
    describe('with valid input', function(){
      var response;
      before(function(done){
        sa.put('localhost:3000/api/notes/' + note._id)
          .send({
            text: 'this is the new text',
            eat: eatToken
          }).end(function(err, res){
            if (err) console.log(err);
            response = res;
            done();
          });
      });

      it('res.status should equal 200', function(){
        expect(response.status).to.eql(200);
      });

      it('res.body.success should equal true', function(){
        expect(response.body.success).to.eql(true);
      });
    });


    describe('with invalid eat', function(){
      var response;
      before(function(done){
        sa.put('localhost:3000/api/notes/' + note._id)
          .send({
            text: 'this is the new text',
            eat: 'bad eat' 
          }).end(function(err, res){
            response = res;
            done();
          });
      });

      it('res.status should equal 401', function(){
        expect(response.status).to.eql(401);
      });
      
      it('res.body.err should equal "UNAUTHORIZED: invalid eat token"', function(){
        expect(response.body.err).to.eql('UNAUTHORIZED: invalid eat token');
      });
    });
    
    describe('with invalid note id', function(){
      var response;
      before(function(done){
        sa.put('localhost:3000/api/notes/' + note._id + 'bad-id')
          .send({
            text: 'this is the new text',
            eat: eatToken 
          }).end(function(err, res){
            response = res;
            done();
          });
      });

      it('res.status should equal 400', function(){
        expect(response.status).to.eql(400);
      });

      it('res.body.err should equal "BAD REQUEST: note not found"', function(){
        expect(response.body.err).to.eql('BAD REQUEST: note not found');
      });

    });
  }); 

  describe('DELETE /api/notes/:id', function(){
    describe('with invalid eat', function(){
      var response;
      before(function(done){
        sa.del('localhost:3000/api/notes/' + note._id)
          .send({
            eat: 'bad token' 
          }).end(function(err, res){
            response = res;
            done();
          });
      });

      it('res.status should equal 401', function(){
        expect(response.status).to.eql(401);
      });

      it('res.body.err should equal "UNAUTHORIZED: invalid eat token"', function(){
        expect(response.body.err).to.eql('UNAUTHORIZED: invalid eat token');
      });
    });

    describe('with invalid id', function(){
      var response;
      before(function(done){
        sa.del('localhost:3000/api/notes/' + note._id + 'bad-id')
          .send({
            eat: eatToken 
          }).end(function(err, res){
            response = res;
            done();
          });
      });

      it('res.status should equal 400', function(){
        expect(response.status).to.eql(400);
      });

      it('res.body.err should equal "BAD REQUEST: note not found"', function(){
        expect(response.body.err).to.eql('BAD REQUEST: note not found');
      });
    });

    describe('with valid input', function(){
      var response;
      before(function(done){
        sa.del('localhost:3000/api/notes/' + note._id)
          .send({
            eat: eatToken 
          }).end(function(err, res){
            response = res;
            done();
          });
      });

      it('res.status should equal 200', function(){
        expect(response.status).to.eql(200);
      });

      it('res.body.success should equal true', function(){
        expect(response.body.success).to.eql(true);
      });
    });
  });
});
