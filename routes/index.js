exports.index = function (req, res){
	/* 
		primitive request that initiates the process 
		emmited when user hit the URL. it is the entry point.	
	*/

	//debug log to get port number where request is entertained
	console.log("5002");
	
	//front page rendering containing 
	res.render('front.ejs',{title2:""});
}