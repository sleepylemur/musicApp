var express = require('express');

var app = express();
app.use(express.static('public'));

app.get('/', function(req,res) {
  res.render('index.html');
});

app.listen(3000, function() {console.log('started musicApp on 3000');});