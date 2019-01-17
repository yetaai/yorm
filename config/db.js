//This is an example of config
var Promise = require('bluebird')
var mysql = require('mysql')
var lschema = 'test'
var myconfig = {
    connectionLimit: 200,
    host: 'localhost',
    port: 3306,
    user: 'user',
    password: 'pass',
    database: lschema,
    debug: false
};

var pool
pool = mysql.createPool(myconfig)
pool.myconfig = pool.myconfig
pool.buflist = []
pool.batchsize = 20
pool.database = lschema

module.exports = pool
