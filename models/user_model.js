var email_user_hset = {
	set_name : "email-user"
};

var user_schema = {
	password : 0,
	email : 1,
	activate_code: 6,
	name: 7,
	user_role: 8,
	isActivated: 9,
	activate_code_expiry: 10
};	

var proof_schema = {
	set_name : "complete:"
}

var nodemailer = require("nodemailer");


function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}
module.exports.add_user = function( redis, user_fname, user_name, user_password, user_email, role, callback) {
	/* 
		It will create a new user in the system. 
	*/
	var activate_code = randomInt(10000,100001);
	var isActivated = 0;
	console.log("random Number: " + activate_code);
	console.log("user Full Name: " + user_fname);
	redis.rpush( user_name, user_password , user_email ,0,0,"0:0:0",0, activate_code, user_fname, role, isActivated, function (err, status){
		if( !err ){
			redis.hset(email_user_hset.set_name, user_email, user_name,function (err, result){
				console.log("Sending Message: " + result);
				if( !err ){
					console.log("Sending Message. No Error: " + result);
					/* IF no error occurs returning status to calling environment*/
					// setup e-mail data with unicode symbols
					// create reusable transport method (opens pool of SMTP connections)
					var smtpTransport = nodemailer.createTransport("SMTP",{
					    service: "Gmail",
					    auth: {
					        user: "sayedmannan123@gmail.com",
					        pass: "fudshmlmzvlafjxt"
					    }
					});
					var mailOptions = {
					    from: "TestWiz: Quiz Platform ✔ <sayedmannan123@gmail.com>", // sender address
					    to: user_email, // list of receivers
					    subject: "Hello " + user_fname, // Subject line
					    text: "Activation Code: " + activate_code, // plaintext body
					    html: "<b>Activation Code: "+activate_code+" . Activate Your Account With This Code.</b>" // html body
					};
					smtpTransport.sendMail(mailOptions, function(error, response){
    				if(!error){
    					console.log("Message sent: " + response.message);
    				}else{
        				console.log(error + "Sending Message");
    				}
    				callback( null, 1);
    // if you don't want to use this transport object anymore, uncomment following line
    //smtpTransport.close(); // shut down the connection pool, no more messages
					});
	
				}else{
					/*
				Some Error occur possibly no db connectivity anymore
					*/
					console.log("ERR AT add_user inside user_module");
				}
			});	
		}else{
			/*
				Some Error occur possibly no db connectivity anymore
			*/
			console.log("ERR AT add_user inside user_module");
			callback( 1, null);
		}
	});
}

module.exports.change_password = function (redis, user, pass, newpass, callback){
	redis.lindex(user , user_schema.password, function (err, passwd){
		if(err){
			/*
				Some Error occur possibly no db connectivity anymore
			*/
			console.log('ERR AT user_model.js AT change_password');
			callback( 1, null);
		}
		else{
			if(pass == passwd){
				redis.lset(user,0,newpass);
				callback( null, true);
			}
			else callback( null, false);
		}
	});
}

module.exports.check_user_name_exists = function(redis,  user_name, callback){
	/* 
		It will check if the user name already
		exists or not
	*/
	redis.exists(user_name, function ( err, status){
		if( !err ){
			/* IF no error occurs returning status to calling environment*/
			callback( null, status);
		}else{
			/*
				Some Error occur possibly no db connectivity anymore
			*/
			console.log('ERR AT user_model.js AT check_user_name_exists');
			callback( 1, null);
		}	
	});
}

module.exports.check_user_email_exists = function( redis, user_email, callback){
	/* 
		It will check if the email address 
		already in use or not!
	*/
	redis.hexists( email_user_hset.set_name , user_email, function ( err, status){
		if( !err ){
			/* IF no error occurs returning status to calling environment*/
			callback( null, status);
		}else{
			/*
				Some Error occur possibly no db connectivity anymore
			*/
			console.log('ERR AT user_model.js AT check_user_email_exists');
			callback( 1, null);
		}	
	});	
}

module.exports.validate_user = function( redis, user_name, user_password, user_role, callback){
	redis.lindex(user_name, user_schema.password,function ( err, pass){
		if( !err ){
			console.log("Came Back from DB userPass: " + pass  );
			if( pass == user_password ){
				console.log("Came Back from DB userPass Success: " + pass);
				redis.lindex(user_name, user_schema.user_role,function ( err, role){
					if(!err){
						console.log("Came Back from DB userRole: " + role);
						if( role == user_role ){
							console.log("Came Back from DB userRole Success. Has Role: " + role);
							redis.lindex(user_name, user_schema.isActivated,function ( err, isActivated){
								if(!err){
									console.log("Came Back from DB userActivated: " + isActivated);
									if( isActivated == 1 ){
										console.log("Came Back from DB userActivated. Success: " + isActivated);
										callback( null, "activated");		
									}else{
										console.log("Came Back from DB userActivated. Failure: " + isActivated);
										callback( null, "activate"); //Redirect to activate.ejs
									}
								}else{
									console.log("Came Back from DB userActivated. Error: " + err);
									callback( 1,null);
								}
							});							
						}else{
							console.log("Came Back from DB userRole Failure. Has Role: " + role);
							callback( null, false);
						}
					}else{
						console.log("ERR AT validate_user inside user_model.js" + err);
						callback( 1, null);
					}
				});
			}else{
				console.log("Came Back from DB userPass Failure: ");
				callback( null, false);
			}
		}else{
			console.log("ERR AT validate_user inside user_model.js" + err);
			callback( 1, null);
		}
	});
}

module.exports.get_user_data = function( redis, user, lower_limit, upper_limit, callback ){
	redis.lrange( user, lower_limit, upper_limit, function ( err, data){
		if( !err ){
			callback( null, data);
		}else{
			callback(1, null);
		}
	});
}

module.exports.get_user_part_list = function( redis, user, callback){
	var str = proof_schema.set_name + user + ":";
	redis.keys( str + "*", function ( err, list){
		if( !err ){
			for( var i=0; i < list.length; i++){
				list[i] = list[i].replace( str, "");
			}
			callback( null, list);
		}else{
			console.log("ERR AT get_user_part_list INSIDE user_model.js");
			callback( 1, null);
		}
	});
}

//-------------------------------SAYED's CODE------------------
module.exports.activate_user = function( redis, user_name, activate_code, callback){
	redis.lindex(user_name, user_schema.activate_code,function ( err, code){
		if(!err){
			console.log("Came Back from DB. Activating User.");
			if(code === activate_code){
				console.log("Came Back from DB. Activating User. Code Matched.");
				redis.lset(user_name,user_schema.isActivated, 1, function(err, result){
					if(!err){
						console.log("Came Back from DB. Activating User. Succefully Updated The Activate Bit.");
						callback(null, true);
					}else{
						console.log("Came Back from DB. Activating User. Couldn't Update The Activate Bit.");
						// Code to do when can't update the activate bit
					}
				});
				
				/*redis.lindex(user_name, user_schema.activate_code_expiry,function ( err, code){

				});*/
			}else{
				console.log("Came Back from DB. Activating User. Code Didn't Match.");
				callback(null, false);
			}
		}else{
			console.log("Came Back from DB. Activating User. Error." + err);
			callback(1, null);
		}
	});
}