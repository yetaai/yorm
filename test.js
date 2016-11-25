var yorm = require("./yorm")

var test = function() {
    // console.log('testing got tbldefs: ' + JSON.stringify(yorm.tbldefs))
    var tt = {}
    var i = 0
    var ta = []
    while (i++ < 3) {
        tt = {}
        tt.id = i + 3
        // tt.value = 'value ' + tt.id
        tt.value = 't' + tt.id
        ta.push(tt)
    }

    yorm.query('delete from zz').then(function() {
        return new Promise(function(resolve, reject) {
            yorm.saveone('zz', {'id':0, 'value': 0}).then(function(){
                resolve()
            })
        })
    }).then(function() {
        return new Promise(function(resolve, reject) {
            yorm.savemany('zz', ta).then(function(){
                resolve()
            })
        })
    }).then(function() {
        yorm.getmany('zz', '').then(function(rs){
            console.log('Database contents after insert by saveone and savemany: ' + JSON.stringify(rs))
            process.exit(0)
        })
    }).catch(function(e) {
        console.log('error in savemany, saveone, getmany: ' + e)
        process.exit(-1)
    })
    // yorm.refreshByKey('zz', ta, ['value'], {'id': 'asc'}, 100).then(function() {
    //     console.log('ta: ' + JSON.stringify(ta))
    // })

    // yorm.refreshone('zz', ta[0], ['value']).then(function(value) {
    //     console.log('value of ta[0]: ' + JSON.stringify(ta[0]))
    //     console.log('value of value: ' + JSON.stringify(value))
    //     console.log('value of ta: ' + JSON.stringify(ta))
    // })
    // var typea = yorm.defType('ekko', {'ebeln': {'ref': 'ot1ekko.ebeln'}, 'lifnr' : {'ref': 'ot1ekko.lifnr'}})
}
yorm.bufferinit().then(function() {
    test()
})
//setTimeout(test, 200) //You donot have to call bufferinit always if you call is certain time after yorm loading.

