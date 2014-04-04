var db = require('mysql').createConnection({
    host : "127.0.0.1",
    user : "root",
    password : "root",
    database : "quizzer"
});
db.connect( function ( err, done){
	if( !err ){
		db.query( "select * from test;", function (err, data) {
			if( !err ){
				console.log(data);
			}else{
				console.log("man");
			}
		});		
	}
});
