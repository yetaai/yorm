var Promise = require('bluebird')
var mysql = require('mysql')
var lschema = 'test'
var myconfig = {
    connectionLimit: 200,
    host: 'localhost',
    port: 3306,
    user: 'user1',
    password: 'pass',
    database: lschema,
    debug: false
};

var pool
pool = mysql.createPool(myconfig)
pool.myconfig = pool.myconfig

module.exports.pool = pool
module.exports.buflist = []
module.exports.batchsize = 20
module.exports.database = lschema