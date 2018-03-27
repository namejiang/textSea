var express = require('express');
var app = express();

app.use(express.static('public'));
app.use(express.static('src'));

app.get('/', function(req, res){
	res.sendFile( __dirname + "/src/index.html" );
});

var server = app.listen(8080, function () {
  	   var host = server.address().address;
  	   var port = server.address().port;
 	  console.log('Example app listening at http://%s:%s', host, port);
});