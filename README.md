# Install Locally is recommended

npm install yorm -s

# Usage

Create your database configuration in dbconfig.js in your project root folder. There is a sample with yorm module folder.

Then create your application tables. You can also define your own structure types as well.

Below example will call parallelly saveone and savemany.

```sql
create table aa(id1 int, id2 int, val1 char(20), primary key(id1, id2)
```

```javascript
var yorm = require('yorm')
var onerecord = {}
onerecord.id1 = '1'
onerecord.id2 = '20'
onerecord.val1 = 'Testing value'

var test = function() {
   yorm.saveone('aa', onerecord)
    var records = []
    for (var i = 0; i < 10, i++) {
      for (var j = 0; j < 3, j++ {
        onerecord = {'id1': i, 'id2':j, 'val1': 'value: ' + i + '/' + 'j'}
        records.push(onerecord)
      }
    }
    yorm.savemany('aa', records).then(function() {
      console.log('Table aa had been inserted many records.'
    }
}

setTimeout(test, 1000)
```

# Run the test and check table data by

```sql
select * from aa;
```

Your will see the value inserted. Also in above example, savemany will assemble sql statemnets in batch in the form of insert into ... on duplicate update ... But you have to enable on duplicate update by set relevant parameter to true.

I will deliver an API document if more persons are interested in this project.