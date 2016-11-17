# Install Locally is recommended

npm install yorm -s

# Usage

Create your database configuration in dbconfig.js. Then create your application tables. You can also define your own structure types as well.

E.g:

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
}
setTimeout(test, 1000)
```

# Run your file and check your database by

```sql
select * from aa;
```

Your will see the value inserted.