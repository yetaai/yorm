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
        tt.value = 'testing value to be overridden'
        ta.push(tt)
    }
    // yorm.refreshByKey('zz', ta, ['value'], {'id': 'asc'}, 100).then(function() {
    //     console.log('ta: ' + JSON.stringify(ta))
    // })

    // yorm.refreshone('zz', ta[0], ['value']).then(function(value) {
    //     console.log('value of ta[0]: ' + JSON.stringify(ta[0]))
    //     console.log('value of value: ' + JSON.stringify(value))
    //     console.log('value of ta: ' + JSON.stringify(ta))
    // })
    yorm.getone('zz', {'id': 9}).then(function(value) {
        console.log('after getone value: ' + JSON.stringify(value))
    }).catch(function(e) {
        console.log("getone failed"  + e)
    })
    yorm.getone('zz', {'id': 9}).then(function(value) {
        console.log('after getone value: ' + JSON.stringify(value))
    }).catch(function(e) {
        console.log("getone failed"  + e)
    })
    var typea = yorm.defType('ekko', {'ebeln': {'ref': 'ekko.ebeln'}, 'lifnr' : {'ref': 'ekko.lifnr'}})
}
setTimeout(test, 200)

