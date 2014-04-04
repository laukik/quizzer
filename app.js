
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var redis = require("redis").createClient();
var app = express();
var RedisStore = require('connect-redis')(express);
var redirect = require('express-redirect')(app);
var db = require('mysql').createConnection({
    host : "localhost",
    user : "root",
    password : "root"
});
db.connect();
db.query("use quizzer");
// all environments
app.set('port', process.env.PORT || 3001);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('controller_dir', __dirname + '/public');
app.use(express.favicon());
app.use(express.bodyParser( { keepExtensions: true, uploadDir: __dirname + '/public/uploads' } ));
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({
	store: new RedisStore({
    host: 'localhost',
    port: 6379,
    db: 2
  }),
  secret: '1234567890QWERTY'
}));

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

require('./controller/controller')(app,redis,db);



var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});



//socket.io

var io = require('socket.io').listen(server);  
io.enable('browser client minification'); // send minified client
io.enable('browser client etag'); // apply etag caching logic based on version number
io.enable('browser client gzip'); // gzip the file
io.set('log level', 1);
io.set('browser client expires',315360000); // reduce logging
io.set('transports', [ // enable all transports (optional if you want flashsocket)
    'websocket'
  , 'flashsocket'
  , 'htmlfile'
  , 'xhr-polling'
  , 'jsonp-polling'
]);

require('./sockets/sockets')( io, redis);
