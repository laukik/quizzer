//console.log("ERR AT INSIDE");

var log_schema = {
	set_name : "log:",
	section_count : 0,
	question_count : 1,
	disconnect_count : 3,
	duration : 2
}

var range_limit = {
	lower_limit : 0,
	upper_limit : -1
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
	student_password : 7,
	section_count : 9
};

var result_schema = {
	set_name : 'result:'
};

var section_schema = {
	set_name : "Section:",
	rank : 0,
	section_name : 1,
	rules_blog : 2,
	total_questions : 3,
	section_cutoff : 4,section_duration : 5
};

var section_answers_schema = {
	set_name : "section_answer:"
};



var Redis = require("./redis_model");

module.exports.add_later_question = function( redis, Qid, Sid, full){
	insert_question_detail( redis, Qid, Sid, full);
	redis.lindex(quiz_schema.set_name + Qid, 10 + Sid ,function (err, Qcount){
		if(err){
			console.log("ERR AT add_later_question INSIDE quiz_model.js");
		}
		else{
			var intcount = parseInt(Qcount) + 1;
			redis.lset(quiz_schema.set_name + Qid, 10 + Sid, intcount);		
			redis.lset(section_schema.set_name + Qid + ":" + Sid, 3, intcount);
			console.log('olla');
		}
	});
}

module.exports.add_section = function( redis, Qid, user, callback){
	get_quiz_section_count( redis, Qid, function( err, sec){
		if(err){
			console.log("ERR AT add_section INSIDE quiz_model.js");
			callback( 1, null);
		}
		else{
			console.log("aaa");
			var x = parseInt(sec);
			x++;
			redis.lset(quiz_schema.set_name + Qid, quiz_schema.section_count, x,function (err, res){
				if( err ) console.log("bb");
				else{
					callback( null, x);
					console.log('olla');		
				} 
			});
			redis.rpush( quiz_creation_backup_schema.set_name + user + ":"+ Qid , x-1,0, function (err, p){
				if( err ) console.log("bb2");
			});
			
		}
	});
}

module.exports.append_user_answer = function( redis, user, Qid, ans, callback){
	redis.lindex(user + ":" + Qid , 0, function (err, data){
		if(err){
			console.log("ERR AT append_user_answer INSIDE quiz_model.js");
			callback( 1, null);
		}else{
			data += ans;
			redis.lset(user+ ":" + Qid,0,data, function ( err, stat){
				if( !err ){
					callback( null, 1);
					console.log('olla');
				}else{
					console.log("ERR AT append_user_answer INSIDE quiz_model.js");
					callback( 1, null);
				}
			});
		}
	});
}

module.exports.append_user_answer_on_timeout = function ( redis, user, Qid, count, callback){
	redis.lindex(user + ":" + Qid , 0, function (err, data){
		if(err){
			console.log("ERR AT append_user_answer_on_timeout INSIDE quiz_model.js");
			callback( 1, null);
		}else{
			for( var i=0; i < count; i++) data += '?';
			redis.lset(user+ ":" + Qid,0,data, function ( err, stat){
				if( !err ){
					callback( null, 1);
					console.log('olla');
				}else{
					console.log("ERR AT append_user_answer_on_timeout INSIDE quiz_model.js");
					callback( 1, null);
				}
			});
		}
	});	
}

module.exports.delete_quiz = function( redis, Qid, user ){
	redis.lindex( quiz_schema.set_name + Qid , 9, function (err,Sec){
		if(err){
			console.log("ERR AT delete_quiz INSIDE quiz_model.js");
			callback( 1, null);
		}
		else{
			redis.del(quiz_schema.set_name + Qid);
			var intsec = parseInt(Sec);
			for( var j=0; j < intsec; j++) redis.del(section_schema.set_name + Qid +":"+j);
			console.log('olla');
		}
	});
	redis.del(quiz_creation_backup_schema.set_name + user + ":" + Qid);
}

module.exports.delete_quiz_creation_backup = function( redis, creator, Qid ){
	
	redis.del(quiz_creation_backup_schema.set_name + creator + ":" + Qid);
	console.log('olla');
}

module.exports.do_end_quiz_task = function( redis, user, Qid){
	redis.del("log:"+user+":"+Qid);
	redis.rpush("complete:"+user+":"+Qid,1);
	console.log('olla');
}

module.exports.edit_log_detail = function( redis, user, Qid, feild_idx, value){
	redis.lset( log_schema.set_name + user + ":" + Qid, feild_idx, value);
	console.log('olla edit');
}

module.exports.edit_question_detail = function( redis, Qid, Sid, editQ, opt, questiontt1, add, sub, questiontt2){
	redis.lset( section_schema.set_name + Qid + ":" + Sid , editQ, questiontt1);
	redis.lset( section_schema.set_name + Qid + ":" + Sid , editQ+2, add);
	redis.lset( section_schema.set_name + Qid + ":" + Sid , editQ+3, sub);
	redis.lset( section_schema.set_name + Qid + ":" + Sid , editQ+8, opt[0][0]);
	redis.lindex( section_schema.set_name + Qid + ":" + Sid ,editQ+1, function (err, wt){
		if(err){
			console.log("ERR AT edit_question_detail INSIDE quiz_model.js");
			callback( 1, null);
		}else{
			if( wt[0] != '?'){
				redis.lset( section_schema.set_name + Qid + ":" + Sid ,editQ+1, questiontt2);
				console.log('olla');
			}
		}
	});
	var len =opt[0].length;
	for( var i = 1; i < 5; i++){
		!function syn(i){
			if( i < len ){
				redis.lset( section_schema.set_name + Qid + ":" + Sid , editQ+3+i, opt[0][i]);	
			}
			else{
				redis.lset( section_schema.set_name + Qid + ":" + Sid , editQ+3+i, "????");	
			}
		}(i)
	}
}

module.exports.edit_quiz_detail = function( redis, Qid, Quizpasswd, eventDate, eventTime, enddate, endtime, totalDuration, Quizpasswdforstud){
	redis.lset( quiz_schema.set_name + Qid , 1, Quizpasswd);
	redis.lset( quiz_schema.set_name + Qid , 2, eventDate);
	redis.lset( quiz_schema.set_name + Qid , 3, eventTime);
	redis.lset( quiz_schema.set_name + Qid , 4, enddate);
	redis.lset( quiz_schema.set_name + Qid , 5, endtime);
	redis.lset( quiz_schema.set_name + Qid , 6, totalDuration );
	redis.lset( quiz_schema.set_name + Qid , 7, Quizpasswdforstud);
	console.log('olla');
}

module.exports.edit_section_detail = function( redis, Qid, rmc, rank, name, rules, cutoff, duration){
	redis.lset(section_schema.set_name + Qid + ":" + rmc, section_schema.rank, rank);
	redis.lset(section_schema.set_name + Qid + ":" + rmc, section_schema.section_name, name);
	redis.lset(section_schema.set_name + Qid + ":" + rmc, section_schema.rules_blog, rules);
	redis.lset(section_schema.set_name + Qid + ":" + rmc, section_schema.section_cutoff, cutoff);
	redis.lset(section_schema.set_name + Qid + ":" + rmc, section_schema.section_duration, duration);
	console.log('olla');
}

module.exports.generate_section_result = function ( redis, user, Qid, section_number, callback){
	redis.lindex(user + ":" + Qid , 0, function (err, data){
		if(err){
			console.log("ERR AT generate_section_result INSIDE quiz_model.js");
			callback( 1, null);
		}else{
			redis.lrange(section_schema.set_name + Qid+ ":" + section_number , 8, -1, function (err, sectiondata){
				if(err){
					console.log("ERR AT generate_section_result INSIDE quiz_model.js");
					callback( 1, null);
				}else{
					var point = 0;
					var color = [];
					for( var i = 1 ; i < data.length; i++){
						if( data[i] == sectiondata[ ((i-1)*11) + 8 ]){
							// correct solution
							point += parseInt( sectiondata[ ((i-1)*11) + 2]);
							color.push('success');
						}else if( data[i] == '-'){
							color.push(" ");
						}else if( data[i] != '?'){
							// wrong solution
							point -= parseInt( sectiondata[ ((i-1)*11) + 3]);
							color.push('danger');
						}else{
							// Not attempted
							color.push("warning");
						}
					}
					redis.lindex( section_schema.set_name + Qid+ ":" + section_number, section_schema.section_cutoff, function (err, cutoff){
						if( !err ){
							var status = "FAIL";
							if( point > parseInt( cutoff)){
								status = "PASS";
							}
							redis.rpush(result_schema.set_name+user+":"+Qid, point, data, color, status,function (err, stack){
								if(err){
									console.log("ERR AT generate_section_result INSIDE quiz_model.js");
									callback( 1, null);
								}else{
									redis.lset(user+":"+Qid,0,"^");
									callback(null, 1);
									console.log('olla');
								}
							});
						}else{
							console.log("ERR AT generate_section_result INSIDE quiz_model.js");
							callback( 1, null);
						}
					});
					
				}
			});		
		}
	});
}

module.exports.get_log_detail = function( redis, user, Qid, lower_limit, upper_limit,  callback){
	redis.lrange( log_schema.set_name + user + ":" + Qid, lower_limit, upper_limit, function (err, log_data){
		if( err ){
			console.log("ERR AT get_log_detail INSIDE quiz_model.js");
			callback( 1, null);
		}else{
			callback( null, log_data);
			console.log('olla');
		}
	});
}

module.exports.get_log_detail_with_existance = function( redis, user, Qid, lower_limit, upper_limit,  callback){
	Redis.exists( redis, log_schema.set_name + user + ":" + Qid, function ( err, status ){
		if( !err ){
			if ( status ){
				redis.lrange( log_schema.set_name + user + ":" + Qid, lower_limit, upper_limit, function (err, log_data){
					if( !err ){
						callback( null,	"exists", log_data);
						console.log('olla');

					}else{
						console.log("ERR AT get_log_detail_with_existance INSIDE quiz_model.js");
						callback( 1, null, null);
					}
				});
			}else{
				callback( null,	"not_exists", null);
				console.log('olla');
			}
		}else{
			console.log("ERR AT get_log_detail INSIDE quiz_model.js");
			callback( 1, null, null);
		}
	});
}

module.exports.get_question_detail = function( redis, Qid, section_number, question_number, callback){
	// getting starting index
	var start_index = question_schema.section_data_padding + ( question_number * question_schema.question_padding);
	var end_index = start_index + question_schema.question_padding - 1;  
	get_section_detail( redis, Qid, section_number, start_index, end_index, function ( err, question_data){
		if( !err ){
			callback(null, question_data);
			console.log('olla');
		}else{
			console.log("ERR AT get_question_detail INSIDE quiz_model.js");
			callback( 1, null);
		}
	});
}

module.exports.get_quiz_detail = function( redis, Qid, callback){
	redis.lrange( quiz_schema.set_name + Qid, range_limit.lower_limit , range_limit.upper_limit, function (err, quiz_detail){
		if ( !err ){
			callback(null, quiz_detail);
			console.log('olla');
		}else{
			console.log("ERR AT get_quiz_detail INSIDE quiz_model.js");
			callback( 1, null);
		}
	});
}

function get_quiz_detail_generic ( redis, Qid, lower_limit, upper_limit, callback){
	console.log("Getting quiz details generic: " + quiz_schema.set_name + Qid);
	redis.lrange( quiz_schema.set_name + Qid, lower_limit , upper_limit, function (err, quiz_detail){
		if ( !err ){
			console.log('olla');
			callback(null, quiz_detail);
		}else{
			console.log("ERR AT get_quiz_detail INSIDE quiz_model.js");
			callback( 1, null);
		}
	});
}

module.exports.get_quiz_detail_generic = get_quiz_detail_generic ;
module.exports.get_quiz_result = function ( redis, user, Qid, lower_limit, upper_limit, callback){
	redis.lrange( result_schema.set_name + user + ":" + Qid, lower_limit, upper_limit, function ( err, result_data){
		if ( !err ){
			callback( null, result_data);
		}else{
			console.log(" ERR AT get_quiz_result INSIDE quiz_model.js");
			callback( 1, null);
		}
	});
}	

module.exports.get_section_question_count = function( redis, Qid, section_number , callback){
	redis.lindex( section_schema.set_name + Qid + ":" + section_number, section_schema.total_questions , function (err, question_count){
		if ( !err ){
			callback(null, question_count);
			console.log('olla');
		}else{
			console.log("ERR AT get_section_question_count INSIDE quiz_model.js");
			callback( 1, null);
		}
	});
}

function get_quiz_section_count( redis, Qid, callback){
	redis.lindex( quiz_schema.set_name + Qid, quiz_schema.section_count , function (err, section_count){
		if ( !err ){
			callback(null, section_count);
			console.log('olla');
		}else{
			console.log("ERR AT get_quiz_section_count INSIDE quiz_model.js");
			callback( 1, null);
		}
	});
}
module.exports.get_quiz_section_count = get_quiz_section_count;

function get_quiz_count ( redis, callback) {
	redis.get( quizcount.set_name, function ( err, value){
		if ( !err ){
			callback(null, value);
		}else{
			console.log("ERR AT get_quiz_count INSIDE quiz_model.js");
			callback( 1, null);
		}
	});
}
module.exports.get_quiz_count = get_quiz_count;

module.exports.get_quiz_creation_backup_detail = function( redis, creator, Qid, callback ){
	redis.lrange(quiz_creation_backup_schema.set_name + creator + ":" + Qid,  range_limit.lower_limit, range_limit.upper_limit,function (err, result){
		if( !err ){
			callback( null, result);
		}else{
			console.log("ERR AT  get_quiz_creation_backup_detail INSIDE quiz_model.js");
		}
	});
}

module.exports.get_section_answers = function( redis, Qid, section_number, lower_limit, upper_limit,callback){
	redis.lrange( section_answers_schema.set_name + Qid + ":" + section_number, lower_limit, upper_limit, function ( err, answers){
		if( !err ){
			callback( null, answers);
		}else{
			console.log("ERR AT get_section_answers INSIDE quiz_model.js");
			callback( 1, null);
		}
	});
}

function get_section_detail(redis, Qid, rmc, lower_limit, upper_limit, callback){
	redis.lrange(section_schema.set_name + Qid + ":" + rmc, lower_limit , upper_limit,function (err,Sec){
		if(err){
			console.log("ERR AT get_section_detail INSIDE quiz_model.js");
			callback( 1, null);
		}
		else{
			callback( null, Sec);
			console.log('olla');
		}
	});
}
module.exports.get_section_detail = get_section_detail;

module.exports.get_section_names = function( redis, Qid, number_of_sections, callback){
	var namelist = [];
	for( var count=0; count < number_of_sections; count++){
		!function syn(count){
			redis.lindex(section_schema.set_name + Qid + ":" + count , section_schema.section_name,function (err, sname){
				if(err){
					console.log("ERR AT get_section_names INSIDE quiz_model.js");
					callback( 1, null);
				}
				else{
					namelist.push(sname);
					if( count == number_of_sections - 1 ){
						callback( null, namelist);	
					} 
				}
			});
		}(count);
	}
}

module.exports.get_user_quiz_list = function( redis, user, callback){
	get_quiz_count(redis ,function (err, Qc){
		if(err){
			console.log("ERR AT get_user_quiz_list INSIDE quiz_model.js");
			callback( 1, null);
		}else{
			var arr = [];
			for( var i=0; i < Qc ;i++){
				!function syn(i){
					redis.lindex(quiz_schema.set_name + i , quiz_schema.quiz_creator ,function (err, usr){
						if(err){
							console.log("ERR AT get_user_quiz_list INSIDE quiz_model.js");
							callback( 1, null);
						}else{
							if( usr == user){
								arr.push(i);
								console.log(i);
							}
							if( i == Qc - 1 ){
								callback( null, arr)	
							}			
						}
					});
				}(i);
			}
		}
	});
}

module.exports.initilise_user_answer_list = function( redis, user, Qid, callback){
	redis.rpush( user + ":" + Qid, "^", function ( err, stat){
		if( !err ){
			callback( null, stat);
			console.log('olla');
		}else{
			console.log("ERR AT initilise_user_answer_list INSIDE quiz_model.js");
			callback( 1, null);
		}
	});
}

module.exports.insert_quiz_detail = function ( redis, user, Quizpasswd, eventDate, eventTime, enddate, endtime, totalDuration, Quizpasswdforstud, extra1,sectionCount ,callback){
	get_quiz_count( redis, function (err, Qid){
		if( !err ){
			console.log('Qid = ' + Qid);
			redis.rpush( quiz_schema.set_name + Qid, user, Quizpasswd, eventDate, eventTime, enddate, endtime, totalDuration, Quizpasswdforstud, extra1,sectionCount, function (err, status){
				if(err){
					console.log("UNABLE TO INSERT QUIZ DETAILS");
					callback( 1, null);
				}else{
					redis.rpush(quiz_creation_backup_schema.set_name + user + ":"+ Qid , 0,0);
					redis.incr('QuizValue');
					callback( null, Qid );
				}
			});
		}else{
			console.log("ERR AT insert_quiz_detail INSIDE quiz_model.js");
		}
	});
}

module.exports.insert_section_detail = function( redis, creator ,Qid, current_section , rank, section_name, rules_blog, total_questions, section_cutoff, section_duration, extra1, extra2, callback){
	redis.rpush(section_schema.set_name + Qid + ":" + current_section, rank, section_name, rules_blog, total_questions, section_cutoff, section_duration, extra1, extra2,function (err, status){
		if( !err ){
			redis.rpush( quiz_schema.set_name + Qid, total_questions);
			redis.lset(quiz_creation_backup_schema.set_name + creator + ":"+ Qid , quiz_creation_backup_schema.current_section, current_section);
			redis.lset(quiz_creation_backup_schema.set_name + creator + ":"+ Qid , quiz_creation_backup_schema.current_question, 0);
			callback( null, 1);
		}else{
			console.log("ERR AT  insert_section_detail INSIDE quiz_model.js");
			callback( 1, null);
		}
	});
}

function insert_question_detail( redis, Qid, current_section, full ){

	redis.rpush.apply( redis,[section_schema.set_name + Qid + ":" + current_section ].concat(full));
	redis.rpush(section_answers_schema.set_name + Qid + ":" + current_section,full[8]);
}
module.exports.insert_question_detail = insert_question_detail;


module.exports.remove_question = function(redis, Qid, Sid, remQ, callback){
	redis.lindex( quiz_schema.set_name + Qid, 10 + Sid, function (err, Qcount){
		if(err){
			console.log("ERR AT  remove_question INSIDE quiz_model.js");
			callback( 1, null);
		}
		else{
			redis.lrange( section_schema.set_name + Qid + ":" + Sid , remQ, -1, function (err, full){
				if(err){
					console.log("ERR AT  remove_question INSIDE quiz_model.js");
					callback( 1, null);
				}
				else{
					redis.ltrim( section_schema.set_name + Qid + ":" + Sid ,0,remQ-1, function (err, stat){
						if(err){
							console.log("ERR AT remove_question INSIDE quiz_model.js");
							callback( 1, null);
						}
						else{
							full.splice(0,11);
							if( full.length != 0 ){
								redis.rpush.apply( redis,[section_schema.set_name + Qid + ":" + Sid].concat(full));	
							}
						}
					});
				}
			});
			var intcount = parseInt(Qcount) - 1;
			redis.lset('Quiz:'+Qid,10+Sid,intcount);		
			redis.lset('Section:'+Qid+":"+Sid,3,intcount);
			callback( null, 1);
		}
	});
}

module.exports.remove_section = function( redis, Qid, rmc, callback){
	redis.lrange(quiz_schema.set_name + Qid, 9, -1, function (err,Sec){
		if(err){
			console.log("ERR AT  remove_section INSIDE quiz_model.js");
			callback( 1, null);
		}
		else{
			redis.del(section_schema.set_name + Qid + ":" + rmc);
			var intsec = parseInt(Sec[0]);
			redis.lset( quiz_schema.set_name + Qid, 9, intsec-1);
			for( var j=rmc,k=rmc+1; k < intsec; j++,k++){
				!function syn(k){
					redis.lset( quiz_schema.set_name + Qid, j+10, Sec[k+1]);
					if( k == intsec-1) redis.rpop(quiz_schema.set_name + Qid);
				}(k);
			}
			for( var j=rmc,k=rmc+1; k < intsec; j++,k++){
				!function syn(k){
					redis.rename(section_schema.set_name + Qid + ":" + k, section_schema.set_name + Qid + ":" + j);
				}(k);
			}
			callback( null, 1);
		}
	});
}

module.exports.set_log_detail = function( redis, user, Qid, section_count, question_count, duration, trials, server_snap,callback ){
	redis.rpush( log_schema.set_name + user + ":" + Qid, section_count, question_count, duration, trials, server_snap, function (err, stat){
		if( !err ){
			callback(null, stat);
			console.log('olla');
		}else{
			console.log("ERR AT set_log_detail INSIDE quiz_model.js");
			callback( 1, null);
		}
	});
}

module.exports.set_quiz_creation_backup_detail = function( redis,creator, Qid, current_section, current_question, callback ){
	redis.lset(quiz_creation_backup_schema.set_name + creator + ":"+ Qid , quiz_creation_backup_schema.current_section, current_section);
	redis.lset(quiz_creation_backup_schema.set_name + creator + ":"+ Qid , quiz_creation_backup_schema.current_question, current_question);
}

module.exports.user_incomplete_quiz = function( redis, user, callback){
	redis.keys(quiz_creation_backup_schema.set_name + user + ":*",function (err,result){
		if(err){
			callback( 1, null);
			console.log("ERR AT user_incomplete_quiz INSIDE quiz_model.js");
		}else{
			var arr = [], len = result.length, gap = user.length + 7;	
			for( var i=0; i < len ; i++){
				arr.push(result[i].slice(gap));
			}
			callback( null, arr);
		}
	});
}

module.exports.validate_quiz_credentials = function( redis, Qid, passwd, callback){
	redis.lindex( quiz_schema.set_name + Qid, quiz_schema.student_password, function (err, pass){
		if( !err ){
			if( passwd == pass){
				get_quiz_detail_generic(redis, Qid, 2, 5, function(err, result){
					if(!err){
						var currentDate = new Date();
						var currentTime = currentDate.getTime();
						var startDate = new Date(result[0] +" " + result[1]);
						var startTime = startDate.getTime();
						var endDate = new Date(result[2] +" " + result[3]);
						var endTime = endDate.getTime();
						console.log(currentTime + " " +result[0] +" " +result[1] +" " + startTime +" " +result[2] +" " +result[3] +" " + endTime);
						if((startTime <= currentTime) && (currentTime <= endTime)){
							console.log("Can Take Quiz. Time Correct.");
							callback(null, "active", "");
						}else if(startTime >= currentTime){
							console.log("Can't Take Quiz. Quiz Not Activated.");
							//not started
							callback(null, "inactive" , startTime);
						}else if(currentTime >= endTime){
							console.log("Can't Take Quiz. Quiz Expired.");
							//Expired
							callback(null, "expired", endTime);
						}
					}else{
						callback( 1, null);
						console.log("ERR AT validate_quiz_credentials_time INSIDE quiz_model.js");
					}
				});
			}else{
				callback( null, false);
			}
		}else{
			callback( 1, null);
			console.log("ERR AT validate_quiz_credentials INSIDE quiz_model.js");
		}
	});
}
