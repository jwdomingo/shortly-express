var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,

  createUser: function () {
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(this.get('password'), salt);

    this.set({
      'hash': hash,
      'salt': salt
    }).save();
  }
});

module.exports = User;