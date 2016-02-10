var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  
  // Built in Function
  // fetch: function () {
  //   return db.knex.select().from('users')
  //     .where('username', this.get('username'))
  //     .then(function (rows) {
  //       return rows[0];
  //     })
  //     .catch(function (error) {
  //       console.error('user not found', error);
  //     });
  // },

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