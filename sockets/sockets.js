var User = require('../models/user_model');
var Quiz = require('../models/quiz_model');
var sockuser = [];

var log_schema = {
	set_name : "log:",
	section_count : 0,
	question_count : 1,
	disconnect_count : 3,
	duration : 2,
	server_snap : 4
}

var proof_schema = {
	set_name : "complete:"
};

var question_schema = {
	section_data_padding : 8,
	question_padding : 11,
	statement : 0,
	img : 1,
	pos : 2,
	neg : 3,
	opt1 : 4,
	opt2 : 5,
	opt3 : 6,
	opt4 : 7,
	answer : 8,
	extra1 : 9,
	extra : 10 
};

var quizcount = {
	set_name : "QuizValue"
};

var quiz_creation_backup_schema = {
	set_name : "Saved:",
	current_section : 0,
	current_question : 1
};

var quiz_schema = {
	set_name : "Quiz:",
	quiz_creator : 0,
	section_count : 9
};


var range_limit = {
	lower_limit : 0,
	upper_limit : -1
};

var section_schema = {
	set_name : "Section:",
	rank : 0,
	section_name : 1,
	rules_blog : 2,
	total_questions : 3,
	section_cutoff : 4,section_duration : 5
};




module.exports = function ( io, redis) {
	
	io.sockets.on('connection',function (socket){

		socket.on('store_me',function (user,Qid){
			sockuser.push(socket);
			sockuser.push(user);
			sockuser.push(Qid);
		});
		
		socket.on('new_user',function (name, user, pass, email, role){
			/*
				Event trigger when user signup happens
				It will add user to the db and populate its feilds 
				by name , email, and password
			*/
			console.log("name: " + name);
	        User.add_user( redis, name, user, pass, email, role, function ( err, result){
	        	if( !err ){
	        		/*
						If no error occurs then this event 
						will put user to the next page by 
						form submitting.
	        		*/
	        		socket.emit('forward');
	        	}else{
	        		/*
						something wrong happens may be because
						of the db is in down state or missing feilds.
	        		*/
	        		console.log('ERR at newuser in sockets.js');
	        	}
	        });
	    });

	    socket.on('check',function (user_name){
	    	/*
				Event trigger in order to check the
				existance of the user_name in DB 
	    	*/
	    	User.check_user_name_exists( redis, user_name , function( err, status){
	    		if( ! err ){
	    			/* 
	    				No error happens
						------------------------------------
						|	if the status == 1:            |
						|		user already exists        |
						|	else:                          |
						|		user name is available     |
						------------------------------------
	    			*/
	    			if( status ){
	    				/* event to warn existance of user_name*/
	    				socket.emit("tell");
	    			}
	    		}else{
	    			console.log(" ERR AT sockets.js IN check");
	    		}
	    	});
		});

	    socket.on('check_email',function (user_email){
	    	/*
				Event trigger in order to check the
				existance of the user_name in DB 
	    	*/
	    	User.check_user_email_exists( redis, user_email, function( err, status){
	    		if( ! err ){
	    			/* 
	    				No error happens
						---------------------------------------------
						|	if the status == 1:            			|
						|		email address already exists        |
						|	else:                          			|
						|		email address is available     		|
						---------------------------------------------
	    			*/	
	    			if( status ){
	    				/* event to warn existance of email_address */
	    				socket.emit("tell_email");
	    			}
	    		}else{
	    			console.log(" ERR AT sockets.js IN check");
	    		}
	    	});
	    });

		socket.on('no_fault',function(user){
			sockuser.splice(sockuser.indexOf(socket),3);
			socket.emit('forward');
		});

	    socket.on('did',function ( user, Qid){
	    	console.log("did called ");
	    	Quiz.get_log_detail( redis, user, Qid, 0, 1, function (err, data){
	    		if( !err ){
	    			console.log("data: " +data);
	    			Quiz.get_quiz_detail_generic( redis, Qid, 10 + parseInt(data[0]) , 10 + parseInt(data[0]), function ( err, qc){
	    				if( !err ){
	    					Quiz.append_user_answer_on_timeout( redis, user, Qid, parseInt(qc) - parseInt(data[1]),function ( err, stat){
	    						if( !err ){
	    							console.log("qc: " +qc);
	    							Quiz.edit_log_detail( redis, user, Qid, 1, qc);
	    							sockuser.splice(sockuser.indexOf(socket),3);
	    							socket.emit('forward');
	    							socket.emit('end');
	    						}else{

	    						}
	    					});
	    				}else{

	    				}
	    			});
	    			
	    		}else{

	    		}
	    	});
	    });
	    
	    socket.on('verify_pass',function ( user, pass, newpass){
			User.change_password( redis, user, pass, newpass, function ( err, status){
				if( !err ){
					if( status ){
						socket.emit("change");
					}else{
						socket.emit("err");
					}
				}
			});
		});

		socket.on('disconnect',function(){
			console.log('here too');
			var z = sockuser.indexOf(socket);
			if( z != -1){
				var user =sockuser[z+1];
				var Qid = sockuser[z+2];
				Quiz.get_log_detail( redis, user, Qid, 0, -1, function (err, log){
					if( !err ){
						var current_time = new Date().getTime();
						var new_time = parseInt( log[ log_schema.duration]) - current_time + parseInt( log[ log_schema.server_snap]);
						Quiz.edit_log_detail( redis, user, Qid, log_schema.duration, new_time);
						Quiz.edit_log_detail( redis, user, Qid, log_schema.server_snap, current_time);
						console.log('it was here');
					}else{
						console.log(" ERR AT sockets.js IN disconnect");
					}
				});
				sockuser.splice(z,3);
			}
		});

	});

} 