module.exports.exists = function ( redis, schema_name, callback) {
	redis.exists( schema_name, function ( err, status){
		if( !err ){
			if( status == 1 ){
				callback( null, true);
			}else{
				callback( null, false)
			}
		}else{
			console.log("ERR AT exists INSIDE redis_model.js");
			callback( 1, null);
		}
	});
}