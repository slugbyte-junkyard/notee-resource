var bodyparser = require('body-parser');
var User = require('../model/user.js');
var eatAuth = require('../lib/eatauth.js');

module.exports = function(router, passport){
  router.use(bodyparser.json());

  // POST
  // /user :: body -> {username: String, password: base64 String, email: String}
  // success: -> {success: true, eatToken: eatToken}
  // failure: -> {success: false, err: String} 
  router.post('/user', function(req, res){
    console.log('HIT-ROTUE: POST /api/user');
    var newUser = new User({username: req.body.username});
    newUser.basic.email = req.body.email;
    var fromBase64toAlpha = function(str){
      var decoded =  new Buffer(str, 'base64').toString('utf8').trim();
      if (/^([a-zA-Z0-9]|(-|_|!|@|#|\$|%|\^|&|\*|\)|\())+$/.test(decoded)){
        return decoded;
      } else {
        return null;
      }
    };

    var decoded = fromBase64toAlpha(req.body.password);
    if (!decoded){
      console.log('VALIDATION ERROR: password was not correct char range or was not base64');
      return res.status(400).json({success:false, err: 'VALIDATION ERROR: invalid password'});
    }

    newUser.genPasswordHash(decoded, function(err, data){
      if (err) {
        console.log('INTERNAL SERVER ERROR: failed to hash password');
        console.error(err);
        return res.status(500).json({
          success: false,
          err: "INTERNAL SERVER ERROR: failed to complete request"
        });
      }
      newUser.basic.password = data;
      newUser.save(function(err, data){
        if(err){
          console.log('failed to save user');
          console.error(err);
          return res.status(500).json({
            success: false,
            err: "INTERNAL SERVER ERROR: failed to complete requeset"
          });
        }

        newUser.generateEatToken(process.env.APP_SECRET, function(err, eatToken){
          if (err){
            console.log('failed to generate eat');
            console.error(err);
            return res.status(500).json({
              success:false,
              err: "INTERNAL SERVER ERROR: could not complete request"
            });
          }  

          res.status(200).json({
            success: true,
            eatToken: eatToken
          });
        });
      });
    });
  });

  // GET
  // /user/login :: basic auth 
  // success: -> {success: true, eatToken: eatToken}
  // failure: -> {success: false, err: String}
  router.get('/user/login', function(req,res,next){
    console.log('HIT-ROUTE: GET /api/user/login');
    passport.authenticate('basic', function(err, user, info){
      if (err){
        console.error(err);
        res.status(401).json({
          success:false,
          err: err
        });
        return next();
      }

      user.generateEatToken(process.env.APP_SECRET,  function(err, eatToken){
        if (err){
          console.error(err);
          res.status(500).json({
            success:false,
            err: "INTERNAL SERVER ERROR: could not complete request"
          });
          return next();
        }  

        res.status(200).json({
          success: true,
          eatToken: eatToken
        });
        return next();
      });
    })(req, res, next);;
  });
};
