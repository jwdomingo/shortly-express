var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser('secret'));

var sess = {secret: 'secret'};
app.use(session(sess));

var isAuth = function(req, res, next) {
  if (sess.user) {
    next();
  } else {
    sess = req.session;
    sess.error = 'Access Denied';
    res.redirect('/login');
  }
};

app.use(express.static(__dirname + '/public'));

app.get('/', isAuth, function(req, res) {
  res.render('index');
});

app.get('/login', function(req, res) {
  res.render('login');
});

app.get('/create', isAuth, function(req, res) {
  res.render('index');
});

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.get('/links', isAuth, function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/login', function(req, res) {
  var newUser = new User({
    username: req.body.username,
    password: req.body.password
  });

  newUser.fetch()
    .then(function(found){
      if (found) {
        if (util.isValidPassword(found.get('salt'), found.get('hash'), req.body.password)) {
          sess.user = req.body.username;
          return res.redirect('/');
        }
      }
      console.error('Wrong username or password');
      res.redirect('/login');
    });
});

app.post('/signup', function(req, res) {
  var newUser = new User({
    username: req.body.username,
    password: req.body.password
  });

  newUser.fetch()
    .then(function(found){
      if (!found) {
        newUser.createUser();
        sess.user = req.body.username;
        res.redirect('/');
      } else {
        console.error('User already exists');
        res.redirect('/login');
      }
      res.end();
    });
});

app.get('/logout', function(req, res){
  req.session.destroy(function(){
    sess.user = '';
    res.redirect('/login');
  });
});

app.post('/links', isAuth, function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', isAuth, function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
