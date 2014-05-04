 //console.log("ERR AT INSIDE");

/*
	This is the main controller which handles all 
	the routes and direct request and response to
	respected handler and interacts with models in
	order to perform any database related operations. 
	
	Method call by app.js having express object
   	And redis client.

	NOTE:
		It follows Post Redirect Get i.e. PRG format
		Read it for further information.
*/

/* Dependencies from other Modules */

var count = 0;
var User = require("../models/user_model");
var Quiz = require("../models/quiz_model");
var Redis = require("../models/redis_model");
var routes = require("../routes");
var sql = require("../models/sql_model");
/* some frequently used variables */


var log_schema = {
	set_name : "log:",
	section_count : 0,
	question_count : 1,
	disconnect_count : 3,
	duration : 2,
	server_snap : 4
}


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
	type : 9,
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
	section_count : 9,

};


var range_limit = {
	lower_limit : 0,
	upper_limit : -1
};

var result_sql = {
	set_name : "result:"
};

var section_schema = {
	set_name : "Section:",
	rank : 0,
	section_name : 1,
	rules_blog : 2,
	total_questions : 3,
	section_cutoff : 4,section_duration : 5
};



module.exports = function( app, redis, db){

	/* GET request block */
	//======================================================================================================

	
	app.get('/', function (req, res){
		/* 
			primitive request that initiates the process 
			emmited when user hit the URL. it is the entry point.	
		*/

		//debug log to get port number where request is entertained
		console.log("5002");
		if(req.session.isLoggedIn)
			res.redirect('/home');
		else
			res.render('front.ejs',{title2:""});
	});

	app.get('/add-question', is_logged_in,function (req, res){
		
		res.render('addquestion',{ title:req.session.userId, QID : req.session.Q});
	});

	app.get('/change_role', is_logged_in, function (req, res){
		if( req.session.role == "creator"){
			req.session.role = "participant";
			res.redirect('/home_participant');
		}else{
			req.session.role = "creator";
			res.redirect('/home_creator');
		}
	});

	app.get('/cpasswd',function (req,res){
		res.render('cpasswd.ejs', { user : req.session.userId});
	});

	app.get('/create', is_logged_in, function (req, res){
		/*
			This will show the quiz detail  
			filling form. 
		*/
		res.render('predetailofquiz.ejs', {title : req.session.userId});
	});

	app.get('/edit-complete', is_logged_in, function (req, res) {
		var user = req.session.userId;
		Quiz.user_incomplete_quiz( redis, user, function (err, arr){
			if ( !err ){
				res.render("quizList.ejs", { title : user, list : arr});		
			}else{
				console.log("ERR AT /edit-complete INSIDE controller.js");
			}
		});
	});

	app.get('/edit-edit', is_logged_in, function (req, res){
		var user = req.session.userId;
		Quiz.get_user_quiz_list(redis , user, function (err, arr){
			if(err){
				console.log("ERR AT edit-edit INSIDE controller.js");
				res.redirect('/home');
			}else{
				res.render("user_quiz_list",{ title:user, list:arr});
			}	
		});
	});

	app.get('/edit-pre-quizdetail', is_logged_in,function (req,res){
		var Qid = req.session.Q; 
		Quiz.get_quiz_detail( redis, Qid, function ( err, Qd){
			if( !err ){
				res.render('edit-prequiz-detail.ejs',{ title:req.session.userId, Qid:Qid, Qd:Qd.slice(1) });
			}else{
				console.log("ERR AT edit-prequiz-detail INSIDE controller.js");
				res.redirect('/home');
			}
		});
	});

	app.get('/edit-question', is_logged_in,function (req, res){
		var Qid = req.session.Q;
		var Sid = req.cookies.Sid;
		var editQ = (parseInt(req.param('editQ')) - 1) * 11 + 8;
		res.cookie('Eq',editQ);
		Quiz.get_section_detail( redis, Qid, Sid, editQ, editQ+10,function (err, Qdata){
			if(err){
				console.log("ERR AT edit-question INSIDE controller.js");
				res.redirect('/home');
			}else{
				res.render('edit-question.ejs',{ title:req.session.userId, QID : req.session.Q, Qd:Qdata});		
			}
		});
	});

	app.get('/edit-question', is_logged_in,function (req, res){
		var Qid = req.session.Q;
		var Sid = req.cookies.Sid;
		var editQ = (parseInt(req.param('editQ')) - 1) * 11 + 8;
		res.cookie('Eq',editQ);
		Quiz.get_section_detail( redis, Qid, Sid, editQ, editQ+10,function (err, Qdata){
			if(err){
				console.log("ERR AT edit-question INSIDE controller.js");
				res.redirect('/home');
			}else{
				res.render('edit-question.ejs',{ title:req.session.userId, QID : req.session.Q, Qd:Qdata});		
			}
		});
	});

	app.get('/edit-section-detail', is_logged_in,function (req, res){
		var user = req.session.userId;
		var Qid = req.session.Q;
		var rmc = req.param('id');
		Quiz.get_section_detail(redis, Qid, rmc,0,5,function (err,Sec){
			if(err){
				console.log("ERR AT /edit-section-detail INSIDE controller.js");
				res.redirect('/home');
			}
			else{
				console.log('aaaaaaa');
				var timemill = parseInt(Sec[5]);
				var DD = parseInt(timemill/(86400000));
				timemill = timemill%86400000;
				var HH = parseInt(timemill/(3600000));
				timemill = timemill%3600000;
				var MM = parseInt(timemill/(60000));
				req.session.S = rmc;
				res.render('edit-sectiondetail.ejs',{title:user,QID:Qid,Sd:Sec,DD:DD,HH:HH,MM:MM});		
			}
		}); 
	});

	app.get('/eval',is_logged_in ,function (req, res){
		var user = req.session.userId;
		var Qid = req.param('Qid');

		Quiz.get_quiz_result( redis, user, Qid, 0, -1, function ( err, result_data){
			if( !err ){
				console.log(result_data);
				var len = result_data.length/4;
				var userdata = [];
				var result = [];
				var marks = [];
				for( var i = 0; i < len; i++){
					!function syn(i){
						Quiz.get_section_detail( redis, Qid, i, section_schema.section_name, section_schema.section_name, function (err, sec_name){
							if( !err ){
								Quiz.get_section_answers( redis, Qid, i, 0, -1, function ( err, correct){
									if( !err ){
										userdata.push(result_data[i*4]); //points
										marks.push(result_data[i*4]);
										userdata.push(sec_name); // section name
										userdata.push(result_data[i*4+1].slice(1)); // user answers
										userdata.push(correct); // correct answers
										var c = result_data[i*4+2].split(',');
										console.log(c);
										userdata.push(c); // color
										result.push(result_data[i*4+3]); // section status PASS or FAIL
										if( i == len-1){
											console.log(userdata);
											if( req.session.role != 'creator'){
												req.session.destroy();	
											}
											
											console.log( "user ::::::: " + user);
											User.get_user_data( redis, user, user_schema.name, user_schema.name, function ( err, user_name){
												if( !err ){
													sql.insert_data( db, Qid, user, user_name, marks);
													res.render('userResult.ejs',{ title:user,Qid:Qid,table:userdata,stat:result});				
												}else{
													console.log("ERR AT /eval INSIDE controller.js");
													res.redirect('/home');			
												}
											});
										}
									}else{
										console.log("ERR AT /eval INSIDE controller.js");
										res.redirect('/home');		
									}
								});
							}else{
								console.log("ERR AT /eval INSIDE controller.js");
								res.redirect('/home');
							}
						});
					}(i)
				}
			}else{
				console.log("ERR AT /eval INSIDE controller.js");
				res.redirect('/home');
			}
		});
	});

	app.get('/home', is_logged_in, function (req, res){
		if( req.session.role == "creator"){
			res.redirect('/home_creator');
		}else{
			res.redirect('/home_participant');
		}
	});

	app.get('/home_creator', is_logged_in ,function (req, res){
		/*
			This will show the home page 
			to the creator. 
		*/
		res.render('select-creator.ejs',{ title : req.session.userId});
	});

	app.get('/home_participant', is_logged_in ,function (req, res){
		/*
			This will show the home page 
			to the participant. 
		*/
		res.render('select-participant.ejs',{ title : req.session.userId});
	});

	app.get('/login', function ( req, res){
		// page for users to signin
		console.log("In Login");
		if(!req.session.isLoggedIn){
			console.log("Not already Logged in");
			res.render('login',{ title : "Please sign in",title2 : "" });
		}else{
			console.log("Already Logged in");
			res.redirect('/home');
		}
	});

	app.get('/logout', is_logged_in,function(req,res){
		req.session.destroy();
		res.redirect('/');
	});

	app.get('/preview', is_logged_in, function (req, res){
		var user = req.session.userId;
		console.log(user + " inside preview" );
		Quiz.get_user_quiz_list(redis , user, function (err, arr){
			if(err){
				console.log("ERR AT edit-edit INSIDE controller.js");
				res.redirect('/home');
			}else{
				console.log("asdasdasdsadasd");
				if( req.param('x') == "1"){
					res.render("preview_quiz",{ title:user, list:arr, title2:"Wrong Password"});
				}else{
					res.render("preview_quiz",{ title:user, list:arr, title2:""});
				}
				
			}	
		});
	});

	app.get('/question_detail_form', is_logged_in, function ( req, res){
		/*
			This will show the question detail 
			filling form. 
		*/
		res.render("createquiz", { title : req.session.userId, QID : req.session.Qid });
	});

	app.get('/quiz_edit_options',is_logged_in ,function (req, res){
		
		res.render('edit-what-detail.ejs',{ title : req.session.userId, Qid : req.session.Qid, Qd : req.param('data').slice(1) });
	});

	app.get('/quiz_login', is_logged_in,function (req, res){
		
		res.render('quiz_taking_login.ejs',{ title: req.session.userId, title2: ""});
	});

	app.get( '/quiz_results', function ( req, res){
		var user = req.session.userId;
		Quiz.get_user_quiz_list( redis, user, function ( err, list){
			if( !err ){
				res.render( 'result_quiz_list', { title:user, title2:"Select Quiz id",  list : list});
			}else{
				console.log("ERR AT /quiz_results AT controller.js");
			}
		});
	});

	app.get('/remove-question', is_logged_in,function (req, res){
		var user = req.session.userId;
		var Qid = req.session.Q;
		var Sid = parseInt(req.cookies.Sid);
		var remQ = (parseInt(req.param('remQ')) - 1) * 11 + 8;
		Quiz.remove_question(redis, Qid, Sid, remQ, function ( err, stat){
			if( !err ){
				res.clearCookie('Q');
				res.clearCookie('Sid');
				res.redirect('/home_creator');
			}else{
				console.log("ERR AT /remove-question INSIDE controller.js");
				res.redirect('/home');
			}
		});
	});

	app.get('/remove-section',is_logged_in, function (req,res){
		var user = req.session.userId;
		var Qid = req.session.Q;
		var rmc = parseInt(req.param('id'));
		Quiz.remove_section( redis, Qid, rmc, function (err, stat){
			if( !err ){
				Quiz.get_section_detail( redis, Qid, rmc, section_schema.section_name, section_schema.section_name, function ( err, section_name){
					if( !err ){
						sql.drop_section_coloumn( db, Qid, section_name);
					}else{
						console.log("ERR AT /remove-section INSIDE controller.js");
					}
				});
				res.redirect('/home_creator');
			}else{
				console.log("ERR AT /remove-section INSIDE controller.js");
				res.redirect('/home');
			}
		});			 
	});

	app.get('/section_detail_form', is_logged_in, function (req, res){
		/*
			This will show the section detail 
			filling form. 
		*/
		res.render('section_detail', { title : req.session.userId, QID : req.session.Qid});
	});

	app.get('/show_question_equation', is_logged_in, function ( req, res) {
		var user = req.session.userId;
		var Qid = req.session.Q;
		Quiz.get_log_detail( redis, user, Qid, 2, 2, function ( err, time){
			if(!err){
				var question = req.param('data');
				var csv = req.param('opt');
				console.log( typeof(csv) + " :type");
				var arr = [],temp = "";
				var len = csv.length;
				for( var i = 0; i < len; i++){
					!function syn(i){
						if( csv[i] == ',' || i == len-1){
							if( i == len - 1){
								temp += csv[i];
								arr.push(temp);
								temp = "";
								res.render('problem_equation.ejs',{ 
									title:user,
									timer : time ,
									Qid : Qid,
									text : req.param('text'),
									equation : req.param('equation'),
									pos : req.param('pos'),
									neg : req.param('neg'),
									option : arr
								});
							}else{
								arr.push(temp);
								temp = "";
							}
						}else{
							temp += csv[i];
						}
					}(i)	
				
				}
			}else{

			}
		});
			
	});

	app.get('/show_question_equation_fill', is_logged_in, function ( req, res) {
		var user = req.session.userId;
		var Qid = req.session.Q;
		Quiz.get_log_detail( redis, user, Qid, 2, 2, function ( err, time){
			if(!err){
				var question = req.param('data');
				res.render('problem_equation_fill',{ 
					title:user,
					timer : time ,
					Qid : Qid,
					text : req.param('text'),
					equation : req.param('equation'),
					pos : req.param('pos'),
					neg : req.param('neg'),
				});

			}else{

			}
		});
			
	});

	app.get('/show_question_essay', is_logged_in, function ( req, res) {
		var user = req.session.userId;
		var Qid = req.session.Q;
		console.log("essay +++++++++++++++++++++++++++++++ ");
		Quiz.get_log_detail( redis, user, Qid, 2, 2, function ( err, time){
			if(!err){
				var question = req.param('data');
				res.render('problem_essay',{ 
					title:user,
					timer : time ,
					Qid : Qid,
					text : req.param('text'),
					wc : req.param('wc'),
					pos : req.param('pos'),
					neg : req.param('neg'),
				});

			}else{

			}
		});
			
	});

	
	app.get('/show_question_image', is_logged_in, function ( req, res) {
		var user = req.session.userId;
		var Qid = req.session.Q;
		Quiz.get_log_detail( redis, user, Qid, 2, 2, function ( err, time){
			if(!err){
				var question = req.param('data');
				var csv = req.param('opt');
				console.log( typeof(csv) + " :type");
				var arr = [],temp = "";
				var len = csv.length;
				for( var i = 0; i < len; i++){
					!function syn(i){
						if( csv[i] == ',' || i == len-1){
							
							if( i == len - 1){
								temp += csv[i];
								arr.push(temp);
								temp = "";
								res.render('problem_img',{ 
									title:user,
									timer : time ,
									Qid : Qid,
									text : req.param('text'),
									img : req.param('img'),
									pos : req.param('pos'),
									neg : req.param('neg'),
									option : arr
								});
							}else{
								arr.push(temp);
								temp = "";
							}
						}else{
							temp += csv[i];
						}
					}(i)	
				
				}
			}else{

			}
		});
			
	});
	
	app.get('/show_question_image_fill', is_logged_in, function ( req, res) {
		var user = req.session.userId;
		var Qid = req.session.Q;
		Quiz.get_log_detail( redis, user, Qid, 2, 2, function ( err, time){
			if(!err){
				var question = req.param('data');
				res.render('problem_img_fill',{ 
					title:user,
					timer : time ,
					Qid : Qid,
					text : req.param('text'),
					img : req.param('img'),
					pos : req.param('pos'),
					neg : req.param('neg'),
				});

			}else{

			}
		});
			
	});

	app.get('/show_question_text', is_logged_in, function ( req, res) {
		var user = req.session.userId;
		var Qid = req.session.Q;
		console.log(" MMMMMMMMMMMMMMMMMMMMMMMMMMM ");
		Quiz.get_log_detail( redis, user, Qid, 2, 2, function ( err, time){
			if(!err){
				var question = req.param('data');
				var csv = req.param('opt');
				console.log( typeof(csv) + " :type");
				var arr = [],temp = "";
				var len = csv.length;
				for( var i = 0; i < len; i++){
					!function syn(i){
						if( csv[i] == ',' || i == len-1){
							
							if( i == len - 1){
								temp += csv[i];
								arr.push(temp);
								console.log(arr + " <<<< " + i);
								temp = "";
								console.log(arr + " >>>>> " + i);
								res.render('problem.ejs',{ 
									title:user,
									timer : time ,
									Qid : Qid,
									text : req.param('text'),
									pos : req.param('pos'),
									neg : req.param('neg'),
									option : arr
								});
							}else{
								arr.push(temp);
								console.log(arr + " <<<< " + i);
								temp = "";
							}
						}else{
							temp += csv[i];
							console.log(temp + " sssssssssssss");
						}
					}(i)	
				
				}
			}else{

			}
		});	
	});

	app.get('/show_question_text_fill', is_logged_in, function ( req, res) {
			var user = req.session.userId;
			var Qid = req.session.Q;
			Quiz.get_log_detail( redis, user, Qid, 2, 2, function ( err, time){
				if(!err){
					var question = req.param('data');
					res.render('problem_equation_fill',{ 
						title:user,
						timer : time ,
						Qid : Qid,
						text : req.param('text'),
						pos : req.param('pos'),
						neg : req.param('neg'),
					});

				}else{

				}
			});
				
		});
	
	app.get('/show_rules_page', is_logged_in, function (req, res){

		res.render("info.ejs",{ title : req.session.userId, Qid : req.session.Q, name : req.param('name'), rule : req.param('rule'), qc : req.param('qc')});
	});

	app.get('/update_profile', is_logged_in, function ( req, res){
		res.render('profile',{ title: req.session.userId});
	});

	app.get('/view_result_list',function (req, res){
		User.get_user_part_list( redis, req.session.userId, function ( err, list){
			if( !err ){
				res.render('participation_list', { title : req.session.userId, list : list, title2 : "Select Quz-Id"});		
			}else{
				console.log(" ERR AT view_result_list AT controller");
			}
		});
	});
	


	/* POST request block */
	//======================================================================================================
	


	app.post('/add-section',is_logged_in ,function (req, res){
		var Qid = req.session.Q;
		console.log(Qid + ">>>>>");
		var user = req.session.userId;
		Quiz.add_section(redis, Qid, user,function (err, sec){
			if(err){
				console.log("ERR AT /add_section INSIDE controller.js");
				res.redirect('/home');
			}
			else{
				var x = parseInt(sec);
				req.session.QTS = x;
				req.session.CS = x-1;
				req.session.Qid = Qid;
				res.redirect('/section_detail_form');
			}
		});
	});

	app.post('/del-quiz',is_logged_in,function (req,res){
		var user = req.session.userId;
		var Qid = req.session.Q;
		Quiz.delete_quiz( redis, Qid, user);
		res.redirect('/home_creator'); 
	});

	app.post('/edit-quizdetail', is_logged_in,function (req,res){
		var user = req.session.userId;
		var Qid = req.session.Q;
		
		var acttime = req.param('acttime');
		var times = acttime.split(' ');
		var eventDate = times[0];
		var eventTime =  times[1];
		var date = eventDate.split("-");
		eventDate = date[1]+"/"+date[0]+"/"+date[2];
		console.log(eventDate +" " + eventTime);
		/*
			end time of quiz according to
			the main server. 
		*/
		var endtimex = req.param('endtime');
		times = endtimex.split(' ');
		var enddate = times[0];
		var endtime = times[1];
		date = enddate.split("-");
		enddate = date[1]+"/"+date[0]+"/"+date[2];
		console.log(enddate +" " + endtime);

		Quiz.edit_quiz_detail( redis, Qid, req.param('password'), eventDate, eventTime, enddate, endtime, "", req.param('password2') );
		res.redirect('/home_creator');
	});

	app.post('/edit-sectiondetail', is_logged_in,function (req,res){
		var user = req.session.userId;
		var Qid = req.session.Q;
		var rmc = req.session.S;
		var sectiondd = 0,
		sectionhh = parseInt(req.param('duration-hours'))*3600,
		sectionmm = parseInt(req.param('duration-minutes'))*60,
		sectionDuration = ( sectiondd + sectionhh + sectionmm )*1000;
		Quiz.edit_section_detail( redis, Qid, rmc,"",req.param('name'), req.param('rules'), req.param('cutoff'), sectionDuration );
		res.redirect('/home_creator');
	});

	app.post('/insert-add-question',is_logged_in ,function (req, res){
		
		var user = req.session.userId;
		var Qid = req.session.Q;
		var Sid = parseInt(req.cookies.Sid);
		var type = req.param('type');
		var full = [];
		full.push(req.param('questiontt1'));
		if( req.param('paths') == "0" ){
			full.push("????");
		}else{
			if( type == 'ftsimg' || type == 'mcqimgsc'){
				var str = req.files.questiontt2.path;
				var qqq = str.replace( app.get('controller_dir'), '');
				full.push(qqq.replace( 'public/', ''));	
			}else {
				full.push(req.param('equation'));
			}
		}
		full.push(req.param('add'));
		full.push(req.param('sub'));
		var opt = req.param('opt');
		var len = opt[0].length;
		for( var i = 1; i < 5; i++){
			if( i < len ) full.push(opt[0][i]);
			else full.push("????");
		}
		full.push(opt[0][0]);
		full.push(type);
		full.push("RFU");
		
		Quiz.add_later_question( redis, Qid, Sid, full);
		res.redirect('/home_creator');
	});

	app.post('/insert-edit-question', is_logged_in,function (req, res){
		var user = req.session.userId;
		var Qid = req.session.Q;
		var Sid = req.cookies.Sid;
		var editQ = parseInt(req.cookies.Eq);
		var opt = req.param('opt');
		try{
			var str = req.files.questiontt2.path;	
		}catch(ex){

		}
		
		var questiontt2 = "";
		if( str ){
			var qqq = str.replace( app.get('controller_dir'), '');
			questiontt2 = qqq.replace( 'public/', '');	
		}
		Quiz.edit_question_detail( redis, Qid, Sid, editQ, opt, req.param('questiontt1'), req.param('add'), req.param('sub'), questiontt2);
		res.clearCookie('Sid');
		res.clearCookie('Eq');
		res.redirect('/home_creator');
	});

	app.post('/question_detail', is_logged_in, function ( req, res){
		var Qid = req.session.Qid;
		var creator = req.session.userId;
		var current_section = req.session.CS;
		var type = req.param('type');
		var full = [];
		full.push(req.param('questiontt1'));
		if( req.param('paths') == "0" ){
			full.push("????");
		}else{
			if( type == 'ftsimg' || type == 'mcqimgsc'){
				var str = req.files.questiontt2.path;
				var qqq = str.replace( app.get('controller_dir'), '');
				full.push(qqq.replace( 'public/', ''));	
			}else {
				full.push(req.param('equation'));
			}
		}
		full.push(req.param('add'));
		full.push(req.param('sub'));
		var opt = req.param('opt');
		var len = opt[0].length;
		for( var i = 1; i < 5; i++){
			if( i < len ) full.push(opt[0][i]);
			else full.push("????");
		}
		full.push(opt[0][0]);
		full.push(type);
		full.push("RFU");
		Quiz.insert_question_detail( redis, Qid,  current_section, full);
		var btx = parseInt(req.session.CQ) + 1;
		req.session.CQ = btx;
		Quiz.set_quiz_creation_backup_detail( redis, creator, Qid, current_section, btx);
		if( btx == req.session.QTQ ){ //section complete
			var atx = parseInt(current_section) + 1;
			req.session.CS = atx;
			console.log("here 2");
			if( atx == req.session.QTS){
				Quiz.delete_quiz_creation_backup( redis, creator, Qid );
				res.redirect('/home_creator');
				//res.render('select.ejs',{ title : creator });
			}else{
				res.redirect("/section_detail_form");
			}
		}else{
			res.redirect("/question_detail_form");
		}
	});

	app.post('/quiz_detail', is_logged_in, function ( req, res){
		/*
			gathering quiz meta data which is as follows
		*/
		/*
			quiz creator's name who created it.
		*/
		var user = req.session.userId;
		/*
		 	quiz password which will allow 
		 	quiz creator to make changes in
		 	the quiz. 
		*/
		var Quizpasswd = req.param('password'), 
		/*
			It will provide access of
			quiz to the participant.
			It will act as barrier to
			the people who are not allowed
			to take the quiz, as they don't,
			know the password. 
		*/
		Quizpasswdforstud = req.param('password2');
		/* 	depricated feild
			to be removed shortly.
		*/
		totalDuration = req.param('duration'),
		/*
			total number of sections
			in the quiz.
		*/
		sectionCount = req.param('section');
		/* 
			Only within below duration
			one can see the quiz active.
		*/
		/*
			start time of quiz according to
			the main server. 
		*/
		var acttime = req.param('acttime');
		var times = acttime.split(' ');
		var eventDate = times[0];
		var eventTime =  times[1];
		var date = eventDate.split("-");
		eventDate = date[1]+"/"+date[0]+"/"+date[2];
		console.log(eventDate +" " + eventTime);
		/*
			end time of quiz according to
			the main server. 
		*/
		var endtimex = req.param('endtime');
		times = endtimex.split(' ');
		var enddate = times[0];
		var endtime = times[1];
		date = enddate.split("-");
		enddate = date[1]+"/"+date[0]+"/"+date[2];
		console.log(enddate +" " + endtime);
		/*
			storing all the meta data.....
		*/

		Quiz.insert_quiz_detail( redis, user, Quizpasswd, eventDate, eventTime, enddate, endtime, totalDuration, Quizpasswdforstud, "RFU",sectionCount, function( err, Qid){
			if ( !err ){
				/* Saving frequently accesible data in session*/
				sql.create_result_table( db, Qid);
				req.session.Qid = Qid;
				req.session.QTS = sectionCount;
				req.session.CS = 0;
				res.redirect('/section_detail_form');
			}else{
				console.log("ERR AT /quiz_detail INSIDE controller.js");
				res.redirect('/home');
			}
		});	
	});

	app.post('/quiz_edit', is_logged_in, function ( req, res){
		var user = req.session.userId;
		var Qid = req.param('choice');
		Redis.exists(redis, quiz_creation_backup_schema.set_name + user + ":" + Qid ,function (err, status){
			if(err){
				console.log("ERR AT /quiz_edit INSIDE controller.js");
				res.redirect('/home');
			}
			else{
				if(status){
					res.redirect('/edit-complete');
				}else{
					Quiz.get_quiz_detail(redis, Qid,function (err, Qd){
						if(err){
							console.log("ERR AT /quiz_edit INSIDE controller.js");
							res.redirect('/home');				
						}
						else{
							if( req.param('passwd') == Qd[1]){
								req.session.Q = Qid;
								var number_of_sections = parseInt(Qd[9]);
								Quiz.get_section_names( redis, Qid, number_of_sections, function ( err, namelist){
									if( !err ){
										Qd = Qd.concat(namelist);
										res.render('edit-what-detail.ejs',{ title:user, Qid:Qid, Qd:Qd.slice(1) });
										//res.redirect('/quiz_edit_options?data='+Qd);		
									}else{
										console.log("ERR AT /quiz_edit INSIDE controller.js");
										res.redirect('/home');					
									}
								});
							}else{
								res.cookie('W',0);
								res.redirect('/edit-edit');
							}		
						}
					});
				}	
			}
		});
	});

	app.post('/section_detail', is_logged_in, function ( req, res){
		var Qid = req.session.Qid,
		creator = req.session.userId,
		rank = req.param('rank'),
		sectionName = req.param('name'),
		rulesBlog = req.param('rules'),
		sectionCutoff = req.param('cutoff'),
		sectiondd = parseInt(req.param('duration-days'))*86400,
		sectionhh = parseInt(req.param('duration-hours'))*3600,
		sectionmm = parseInt(req.param('duration-minutes'))*60,
		sectionDuration = ( sectiondd + sectionhh + sectionmm   )*1000,
		totalQuestions = req.param('Qno');
		req.session.QTQ = totalQuestions;
		req.session.CQ = 0;
		console.log(sectionName);
		Quiz.insert_section_detail( redis, creator, Qid, req.session.CS, rank, sectionName, rulesBlog, totalQuestions, sectionCutoff, sectionDuration, "RFU", "RFU", function ( err, reply){
			if( !err ){
				sql.add_section_coloumn( db, Qid, sectionName);
				res.redirect('/question_detail_form');
			}else{
				console.log("ERR AT section_detail INSIDE controller.js");
				res.redirect('/home');
			}
		});
	});

	app.post('/show_incomplete',is_logged_in ,function ( req, res){
		var creator = req.session.userId;
		var Qid = req.param('choice');
		req.session.Qid = Qid;
		Quiz.get_quiz_creation_backup_detail( redis, creator, Qid, function (err, result){
			if( !err ){
				Quiz.get_quiz_section_count( redis, Qid, function (err, section){
					if(err){
						console.log("ERR AT /show_incomplete INSIDE controller.js");
						res.redirect('/home');
					}else{
						if( (result[0] == 0) && (result[1] == 0)){
							Redis.exists( redis, section_schema.set_name + Qid + ":" + result[0], function (err, status){
								if(err){
									console.log("ERR AT /showincomplete INSIDE controller.js");
									res.redirect('/home');
								}
								else{
									if( status == false ){
										req.session.QTS = section;
										req.session.CS = parseInt(result[0]);
										req.session.CQ = parseInt(result[1]);
										res.redirect("/section_detail_form");
									}else{
										Quiz.get_section_question_count( redis, Qid, 0,function (err, totalQinS){
											if(err){
												console.log("ERR AT /showincomplete INSIDE controller.js");
												res.redirect('/home');
											}else{
												req.session.QTQ = totalQinS;
												req.session.QTS = section;
												req.session.CS = parseInt(result[0]);
												req.session.CQ = parseInt(result[1]);
												res.redirect('/question_detail_form');	
											}
										});
									}
								}
							});
						}else{
							Quiz.get_section_question_count( redis, Qid, result[0],function (err, totalQinS){
								if(err){
									console.log("ERR AT /showincomplete INSIDE controller.js");
									res.redirect('/home');
								}else{
									if(result[1] == totalQinS){
										req.session.QTS = section;
										req.session.CS = parseInt(result[0]) + 1;
										req.session.CQ = 0;
										res.redirect('/section_detail_form');
									}else{
										req.session.QTQ = totalQinS;
										req.session.QTS = section;
										req.session.CS = parseInt(result[0]);
										req.session.CQ = parseInt(result[1]);
										res.redirect('/question_detail_form');
									}
								}
							});
						}
					}
				});
			
			}else{
				console.log("ERR AT /show_incomplete INSIDE controller.js");
				res.redirect('/home');
			}
		});							
	});

	app.post('/show_quiz', is_logged_in,  function ( req, res){
		var user = req.session.userId;
		var Qid  = req.session.Q;
		var time;
		console.log('user : ' + user + ' Qid : ' + Qid);
		/* Retriving user status */
		Quiz.get_log_detail( redis, user, Qid, 0, -1, function (err, log_detail){
			if( !err ){
				/*
					checking wether its first question.
					if it's not store answer...
				*/
			console.log( "log_detail " + log_detail);
				if( log_detail[ log_schema.question_count] != "0" ){
					/* store user solution */
					var ans;
					if( req.param('type') == 'essay'){
						ans = '-';
					}else{
						ans = req.param('opti');
						if( !ans ){
							ans = "?";
						}
					}
					console.log( user  + " ::::: inside show_quiz before append ans ::: Qid ::: " + ans + Qid );
					Quiz.append_user_answer( redis, user, Qid, ans, function (err, stat){
						if( err ){
							console.log("ERR AT /show_quiz INSIDE controller.js block 1");
							res.redirect('/home');
						}
						console.log("done append");		
					});
					time = parseInt(req.param('time'));

				}else{
					time = parseInt(log_detail[ log_schema.duration]);
					req.session.time_previous = time;
					req.session.time = new Date().getTime();
				}
				/*
					check if it the last question
					of the section or not
				*/
				Quiz.get_section_detail( redis, Qid, log_detail[ log_schema.section_count], 3, 5, function (err, section_detail){
					if( !err ){
						console.log( "section_detail " +  section_detail);
						if( log_detail[ log_schema.question_count] == section_detail[0]){
							console.log("last Q");
							/* 
								if it is the last question
								check further if it is the
								last section......
							*/
							Quiz.generate_section_result( redis, user, Qid, log_detail[ log_schema.section_count], function ( err, stat){
								if( !err ){
									console.log( "done gen res");
									Quiz.get_quiz_detail_generic( redis, Qid, 9, -1, function ( err, quiz_detail){
										if( !err ){
											console.log( "quiz_detail " + quiz_detail);
											if( parseInt(quiz_detail[0]) - 1 == log_detail[0]){
												/*
												   so the quiz has ended
												   send him to show result 
												*/
												console.log("q ended");
												Quiz.do_end_quiz_task( redis, user, Qid);
												res.redirect('/eval?Qid='+Qid);
											}else{
												/*
													show himm next sectoin detail
													and process previous section
													result
												*/
												console.log("next S detail");
												var new_section = parseInt(log_detail[ log_schema.section_count]) + 1;
												Quiz.get_section_detail( redis, Qid, new_section, 0, 5, function ( err, sec_detail){
													if( !err ){
														console.log( 'sec_detail' +  sec_detail)
														Quiz.edit_log_detail( redis, user, Qid, log_schema.duration, sec_detail[5]);
														Quiz.edit_log_detail( redis, user, Qid, log_schema.section_count, new_section);
														Quiz.edit_log_detail( redis, user, Qid, log_schema.question_count, 0);
														res.redirect('/show_rules_page?name='+ encodeURIComponent(sec_detail[1]) + "&rule=" + encodeURIComponent(sec_detail[2]) + "&qc=" + encodeURIComponent(sec_detail[3]));
													}else{	
														console.log("ERR AT /show_quiz INSIDE controller.js");
														res.redirect('/home');
													}
												});
											}
										}else{
											console.log("ERR AT /show_quiz INSIDE controller.js");
											res.redirect('/home');
										}
									});		
								}else{
									console.log("ERR AndT /show_quiz INSIDE controller.js");
									res.redirect('/home');	
								}
							});
							
						}else{
							/* render the next question */
							Quiz.get_question_detail( redis, Qid, log_detail[log_schema.section_count], log_detail[log_schema.question_count], function  (err, question_data){
								if( !err ){
									console.log(" next Q");
									console.log(time + " time");
									console.log( "question_data " + question_data);
									var time_previous = parseInt(req.session.time_previous);
									console.log( time_previous + " time_previous");
									var current_time = new Date().getTime();
									console.log( current_time + " current_time");
									var browser_time_diffrence =  time_previous - time;
									console.log(browser_time_diffrence + " browser_time_diffrence");
									var server_time_diffrence = current_time - req.session.time;
									console.log(server_time_diffrence + " server_time_diffrence");
									console.log(server_time_diffrence < browser_time_diffrence + 111);
									if( server_time_diffrence  < (browser_time_diffrence + 111 ) && log_detail[ log_schema.question_count] != "0"){
										res.redirect('/cheat');
									}else{											
										Quiz.edit_log_detail( redis, user, Qid, log_schema.question_count, parseInt(log_detail[1]) + 1);
										Quiz.edit_log_detail( redis, user, Qid, log_schema.duration, time);
										Quiz.edit_log_detail( redis, user, Qid, log_schema.server_snap, new Date().getTime());
										req.session.time_previous = time;
										req.session.time = current_time;
										console.log('hahahahahahahahahaha');
										var i;
										console.log(" NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN ");
										// if( question_data[ question_schema.type][0]  == 'f'){
										// 	/*
										// 		Fill the solution
										// 		type questions
										// 	*/
										// 	if( question_data[ question_schema.img] == "????"){
										// 		/* Question contains no image */
										// 		res.redirect('/show_question_text_fill?time='+time+'&text='+question_data[0]+'&pos='+ question_data[2]+'&neg='+ question_data[3]);
										// 	}else if( question_data[ question_schema.type] == "eqsc"){
										// 		 Question contains equation
										// 		res.redirect('/show_question_equation_fill?time='+time+'&text='+question_data[0]+'&pos='+ question_data[2]+'&neg='+ question_data[3]+'&equation='+question_data[1]);						
										// 	}else{
										// 		/* Question contain plane text*/
										// 		res.redirect('/show_question_image_fill?time='+time+'&text='+question_data[0]+'&pos='+ question_data[2]+'&neg='+ question_data[3]+'&img='+question_data[1]);						
										// 	}

										// }else 
										if( question_data[ question_schema.type] == 'essay'){
											/*
												essay type questions
											*/

											res.redirect('/show_question_essay?time='+time+'&text='+encodeURIComponent(question_data[0])+'&pos='+ encodeURIComponent(question_data[2])+'&neg='+ encodeURIComponent(question_data[3])+"&wc="+encodeURIComponent(question_data[4]));
										}else{
											/*
												MCQ type questions
											*/
											for( i = 4; question_data[i] != '????' && i < 8; i++);
											if( question_data[ question_schema.img] == "????"){
												/* Question contains no image */
												res.redirect('/show_question_text?time='+encodeURIComponent(time)+'&text='+encodeURIComponent(question_data[0])+'&pos='+ encodeURIComponent(question_data[2])+'&neg='+ encodeURIComponent(question_data[3])+'&opt='+encodeURIComponent(question_data.slice(4,i)));
											}else if( question_data[ question_schema.type] == "eqsc"){
												/* Question contains equation*/
												console.log(question_data[1]+" Equation");
												res.redirect('/show_question_equation?time='+encodeURIComponent(time)+'&text='+encodeURIComponent(question_data[0])+'&pos='+ encodeURIComponent(question_data[2])+'&neg='+ encodeURIComponent(question_data[3])+'&opt='+encodeURIComponent(question_data.slice(4,i))+'&equation='+question_data[1]);						
											}else{
												/* Question contain plane text*/
												res.redirect('/show_question_image?time='+encodeURIComponent(time)+'&text='+encodeURIComponent(question_data[0])+'&pos='+ encodeURIComponent(question_data[2])+'&neg='+ encodeURIComponent(question_data[3])+'&opt='+encodeURIComponent(question_data.slice(4,i))+'&img='+encodeURIComponent(question_data[1]));						
											}	
										}

									}
									
								}else{
									console.log("ERR AT /show_quiz INSIDE controller.js");
									res.redirect('/home');
								}
							});

						}
					}else{
						console.log("ERR AT /show_quiz INSIDE controller.js");
						res.redirect('/home');
					}
				});
				
			}else{
				console.log("ERR AT /show_quiz INSIDE controller.js block big");
				res.redirect('/home');
			}
		});
	});

	app.post('/show_quiz_result', function ( req, res){
		var Qid = req.param('choice');
		var user = req.session.userId;
		sql.fetch_all( db, Qid, function ( err, data){
			if( !err ){
				res.render('creator_result', { Qid : Qid, data : data,title:user });
			}else{
				res.redirect('/quiz_results');
			}
		});
		
	});

	app.post('/signin', function ( req, res){
		res.redirect('/login'); 
	});

	app.post('/validate',function ( req,res){
		/*
			validation of user credentials
			checking both username and password
		*/
		var user = req.param('uid');
		var passwd = req.param('passwd');
		var role = req.param('role');
		console.log("User: " +user + " Signinig in as: " + role);
		User.validate_user( redis, user, passwd, role, function ( err, result){
			if( !err ){
				console.log("Came Back from DB: " + result);
				if( result === "activated" ){
					console.log("Came Back from DB. In activate. " + result);
					/*
						if true we will createa session
						for that user and route him to
						the home page according to the 
						role chosen by him.
					*/
					/* allowing him to route on
					   other page by using the
					   defined middleware.
					*/
					req.session.isLoggedIn = true;
					/*
						Inserting his username in
						session.
					*/
					req.session.userId = user;

					if( req.param('role') == 'creator'){
						/* 
							on true sending him
							creator's home page.
						*/
						req.session.role = "creator";
						res.redirect('/home_creator');
					}else{
						/* 
							on true sending him
							creator's home page.
						*/
						// res.render('select.ejs',{ title : user });	
						req.session.role = "participant";
						res.redirect('/home_participant');
					}
				}else if(result === "activate"){
					console.log("Came Back from DB. In activate. " + result);
					res.render('activate',{ title : "Please Provide Your Activation Code",title2 : "", username:user, userrole:role});
				}else{
					/* 
						if false the must have
						submitted either wrong 
						password or username so
						we will send him a warning
						message.
					*/
					console.log("Redirecting to Login");
					res.render('login',{ title : "Please sign in",title2 : "Wrong Username or Password or Role" });
				}
			}else{
					console.log("ERR AT /validate");
				}
		});
	});

	app.post('/validate_quiz_id', is_logged_in,function (req,res){
		var user = req.session.userId;
		var Qid = req.param('Qid');
	 	var passwd = req.param('passwd');
	 	/*
			first of all validate qid and password
	 	*/
	 	console.log( user + " user inside validate_quiz_id");
	 	Quiz.validate_quiz_credentials( redis, Qid, passwd, function ( err, status, time){
	 		if( !err ){
	 			console.log( req.session.userId + " user inside validate_quiz_id ::: -1");
	 			if(status === "active" ){
	 				/* 
	 					if credentials is correct 
						check if they have taken
						it, before or not
	 				*/
	 				console.log( req.session.userId + " user inside validate_quiz_id :::: 0" );
	 	
	 				Redis.exists( redis, proof_schema.set_name + req.session.userId + ":" + Qid, function (err, status){
	 					if( !err ){
	 						if( status == 0 ){
	 							/*
									check if user is new or
									he was dissconnected once. 
	 							*/
	 							console.log( req.session.userId + " user inside validate_quiz_id :: 1");
	 							
	 							Quiz.get_log_detail_with_existance( redis, req.session.userId, Qid, 0, -1, function ( err, status, log_detail){
	 								if( !err ){
	 									if( status == "exists"){
	 										/*
												set his log information into
												his session.
	 										*/
	 										req.session.Q = Qid;
	 										var sec_num = parseInt(log_detail[log_schema.section_count]);
	 										var ques_num = parseInt(log_detail[log_schema.question_count]);
	 										if( ques_num != 0){
	 											/*
													In middle of section
	 											*/
	 											ques_num--;
		 										Quiz.get_question_detail( redis, Qid, sec_num, ques_num, function  (err, question_data){
		 											if( !err ){
		 												console.log(" next Q");
		 												console.log( "question_data " + question_data);
	 													req.session.time_previous = log_detail[ log_schema.duration];
	 													var i;
		 												for( i = 4; question_data[i] != '????' && i < 8; i++);
														var current_time = new Date().getTime();
														req.session.time = current_time;
												        Quiz.edit_log_detail( redis, req.session.userId, Qid, log_schema.server_snap, current_time);
														if( question_data[ question_schema.img] == "????"){
		 													/* Question contains no image */
		 													res.redirect('/show_question_text?time='+encodeURIComponent(log_detail[ log_schema.duration])+'&text='+encodeURIComponent(question_data[0])+'&pos='+ encodeURIComponent(question_data[2])+'&neg='+ encodeURIComponent(question_data[3])+'&opt='+encodeURIComponent(question_data.slice(4,i)));
		 												}else if( question_data[ question_schema.type] == "eqsc"){
					 													/* Question contains no image */
					 													res.redirect('/show_question_equation?time='+encodeURIComponent(log_detail[ log_schema.duration])+'&text='+encodeURIComponent(question_data[0])+'&pos='+ encodeURIComponent(question_data[2])+'&neg='+ encodeURIComponent(question_data[3])+'&opt='+encodeURIComponent(question_data.slice(4,i))+'&equation='+question_data[1]);
					 									}else if( question_data[ question_schema.type] == 'essay'){
		 													res.redirect('/show_question_essay?time='+encodeURIComponent(log_detail[ log_schema.duration])+'&text='+encodeURIComponent(question_data[0])+'&pos='+ encodeURIComponent(question_data[2])+'&neg='+ encodeURIComponent(question_data[3]));						
		 												}else{
		 													res.redirect('/show_question_image?time='+encodeURIComponent(log_detail[ log_schema.duration])+'&text='+encodeURIComponent(question_data[0])+'&pos='+ encodeURIComponent(question_data[2])+'&neg='+ encodeURIComponent(question_data[3])+'&opt='+encodeURIComponent(question_data.slice(4,i))+'&img='+encodeURIComponent(question_data[1]));						
		 														
		 												}
		 											}else{
		 												console.log("ERR AT /show_quiz INSIDE controller.js");
		 												res.redirect('/home');
		 											}
		 										});
	 										}else{
	 											/* 
	 												check what to render
													rules page or question
	 											*/
	 											Quiz.get_section_detail( redis, Qid, sec_num, section_schema.section_duration, section_schema.section_duration, function (err, duration){
	 												if( !err ){
	 													if( duration == log_detail[ log_schema.duration]){
	 														//  if rule page
	 														Quiz.get_section_detail( redis, Qid, sec_num, 0, 5, function ( err, sec_detail){
	 															if( !err ){
	 																Quiz.initilise_user_answer_list( redis, req.session.userId, Qid, function (err, stat){
	 																	if( !err ){

	 																	}else{
	 																		console.log("ERR AT /validate_quiz_id INSIDE controller.js");
	 																		res.redirect('/home');
	 																	}
	 																});
	 																res.redirect('/show_rules_page?name='+ encodeURIComponent(sec_detail[1]) + "&rule=" + encodeURIComponent(sec_detail[2]) + "&qc=" + encodeURIComponent(sec_detail[3]));
	 															}else{
	 																console.log("ERR AT /validate_quiz_id INSIDE controller.js");
	 																res.redirect('/home');
	 															}
	 														});
	 													}else{
	 														//  if question
					 										Quiz.get_question_detail( redis, Qid, sec_num, ques_num, function  (err, question_data){
					 											if( !err ){
					 												console.log(" next Q");
					 												console.log( "question_data " + question_data);
				 													req.session.time_previous = log_detail[ log_schema.duration];
				 													var i;
					 												for( i = 4; question_data[i] != '????' && i < 8; i++);
																	var current_time = new Date().getTime();
																	req.session.time = current_time;
															        Quiz.edit_log_detail( redis, req.session.userId, Qid, log_schema.server_snap, current_time);
																	if( question_data[ question_schema.img] == "????"){
					 													/* Question contains no image */
					 													res.redirect('/show_question_text?time='+encodeURIComponent(log_detail[ log_schema.duration])+'&text='+encodeURIComponent(question_data[0])+'&pos='+ encodeURIComponent(question_data[2])+'&neg='+ encodeURIComponent(question_data[3])+'&opt='+encodeURIComponent(question_data.slice(4,i)));
					 												}else if( question_data[ question_schema.type] == 'essay'){
		 																res.redirect('/show_question_essay?time='+encodeURIComponent(log_detail[ log_schema.duration])+'&text='+encodeURIComponent(question_data[0])+'&pos='+ encodeURIComponent(question_data[2])+'&neg='+ encodeURIComponent(question_data[3]));						
		 															}else if( question_data[ question_schema.type] == "eqsc"){
					 													/* Question contains no image */
					 													res.redirect('/show_question_equation?time='+encodeURIComponent(log_detail[ log_schema.duration])+'&text='+encodeURIComponent(question_data[0])+'&pos='+ encodeURIComponent(question_data[2])+'&neg='+ encodeURIComponent(question_data[3])+'&opt='+encodeURIComponent(question_data.slice(4,i))+'&equation='+question_data[1]);
					 												}

		 															
		 															else{
					 													res.redirect('/show_question_image?time='+encodeURIComponent(log_detail[ log_schema.duration])+'&text='+encodeURIComponent(question_data[0])+'&pos='+ encodeURIComponent(question_data[2])+'&neg='+ encodeURIComponent(question_data[3])+'&opt='+encodeURIComponent(question_data.slice(4,i))+'&img='+encodeURIComponent(question_data[1]));						
					 												}
					 											}else{
					 												console.log("ERR AT /show_quiz INSIDE controller.js");
					 												res.redirect('/home');
					 											}
					 										});
	 													}
	 												}else{
	 													console.log("ERR AT /show_quiz INSIDE controller.js");
	 													res.redirect('/home');
	 												}
	 											});
	 										}
	 									}else{
	 										console.log( user + " user inside validate_quiz_id :: 2");
	 	
	 										req.session.Q = Qid;
	 										Quiz.get_section_detail( redis, Qid, 0, 0, 5, function ( err, sec_detail){
	 											if( !err ){
	 												console.log( "section :::::: " + sec_detail + " :::: user :  " + req.session.userId);
	 												Quiz.set_log_detail( redis, req.session.userId, Qid, 0, 0, sec_detail[ section_schema.section_duration],3, 0, function (err, status){
	 													if( !err ){
	 														Quiz.initilise_user_answer_list( redis, req.session.userId, Qid, function (err, stat){
	 															if( !err ){

	 															}else{
	 																console.log("ERR AT /validate_quiz_id INSIDE controller.js");
	 																res.redirect('/home');
	 															}
	 														});
	 														res.redirect('/show_rules_page?name='+ encodeURIComponent(sec_detail[1]) + "&rule=" + encodeURIComponent(sec_detail[2]) + "&qc=" + encodeURIComponent(sec_detail[3]));
	 													}else{
	 														console.log("ERR AT /validate_quiz_id INSIDE controller.js");
	 														res.redirect('/home');
	 													}
	 												});
	 											}else{
	 												console.log("ERR AT /validate_quiz_id INSIDE controller.js");
	 												res.redirect('/home');
	 											}
	 										});
	 									}
	 								}else{
	 									console.log("ERR AT /validate_quiz_id INSIDE controller.js");
	 									res.redirect('/home');
	 								}
	 							});

	 						}else{
	 							/* 
	 								since he/she had already taken the quiz
									show them the result page of theirs.....
	 							*/
	 							res.redirect('/eval?Qid='+Qid); // To be done.......
	 						}
	 					}
	 				});
	 			}else{
	 				if( req.session.role == 'creator'){
	 					res.redirect('/preview?x=1');
	 				}else{
	 					if( status == "inactive"){
	 						res.render('quiz_taking_login', { title:req.session.userId, title2:"Quiz Inactive. It will start on " + new Date(time) });	
	 					}else if( status == "expired" ){
	 						res.render('quiz_taking_login', { title:req.session.userId, title2:"Quiz Expired on " + new Date(time) });
	 					}else{
	 						var user = req.session.userId;
	 						res.render('quiz_taking_login', { title:user, title2:"Wrong Quiz-id Or Password"});
	 					}
	 				}
	 			}
	 		}else{
	 			console.log("ERR AT /validate_quiz_id INSIDE controller.js");
	 			res.redirect('/home');
	 		}
	 	});
	});

 	app.post('/view_result',function (req, res){
 		var user = req.session.userId;
 		var Qid = req.param('Qid');
 		Quiz.get_quiz_result( redis, user, Qid, 0, -1, function ( err, result_data){
 			if( !err ){
 				console.log(result_data);
 				var len = result_data.length/4;
 				var userdata = [];
 				var result = [];
 				var marks = [];
 				for( var i = 0; i < len; i++){
 					!function syn(i){
 						Quiz.get_section_detail( redis, Qid, i, section_schema.section_name, section_schema.section_name, function (err, sec_name){
 							if( !err ){
 								Quiz.get_section_answers( redis, Qid, i, 0, -1, function ( err, correct){
 									if( !err ){
 										userdata.push(result_data[i*4]); //points
 										marks.push(result_data[i*4]);
 										userdata.push(sec_name); // section name
 										userdata.push(result_data[i*4+1].slice(1)); // user answers
 										userdata.push(correct); // correct answers
 										var c = result_data[i*4+2].split(',');
 										console.log(c);
 										userdata.push(c); // color
 										result.push(result_data[i*4+3]); // section status PASS or FAIL
 										if( i == len-1){
 											console.log(userdata);
 											//req.session.destroy();
 											console.log( "user ::::::: " + user);
 											User.get_user_data( redis, user, user_schema.name, user_schema.name, function ( err, user_name){
 												if( !err ){
 													sql.insert_data( db, Qid, user, user_name, marks);
 													res.render('userResult.ejs',{ title:user,Qid:Qid,table:userdata,stat:result});					
 												}else{
 													console.log("ERR AT /eval INSIDE controller.js");
 													res.redirect('/home');			
 												}
 											});
 										}
 									}else{
 										console.log("ERR AT /eval INSIDE controller.js");
 										res.redirect('/home');		
 									}
 								});
 							}else{
 								console.log("ERR AT /eval INSIDE controller.js");
 								res.redirect('/home');
 							}
 						});
 					}(i)
 				}
 			}else{
 				console.log("ERR AT /eval INSIDE controller.js");
 				res.redirect('/home');
 			}
 		});

 	});


	//---------------------------------SAYED's CODE---------------------------------------

	app.post('/activate', function (req,res){
		var user = req.param('username');
		var activate_code = req.param('activate_code');
		var role = req.param('role');
		console.log("User: " +user + " Signinig in as: " + role + " Activate Code: " + activate_code);
		User.activate_user( redis, user, activate_code, function ( err, result){
			if( !err && result){
				console.log("Came Back From DB to Controller." );
				req.session.isLoggedIn = true;
				/*
					Inserting his username in
					session.
				*/
				req.session.userId = user;

				if( role == 'creator'){
					/* 
						on true sending him
						creator's home page.
					*/
					req.session.role = "creator";
					res.redirect('/home_creator');
				}else{
					/* 
						on true sending him
						creator's home page.
					*/
					// res.render('select.ejs',{ title : user });	
					req.session.role = "participant";
					res.redirect('/home_participant');
				}
			}else{
				console.log("Came Back From DB to Controller. Error" );
				res.render('activate',{ title : "",title2 : "Incorrect Activation Code. Retry.", username:user, userrole:role});
			}
		});
	});
}
//------------------------------------------------------------------------------------------------------------------------------
/* Extra required functions */

function is_logged_in(req, res, next) {

	// if user is authenticated in the session, carry on 
	if (req.session.isLoggedIn == true)
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}

