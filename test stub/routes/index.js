
/*
 * GET home page.
 */

exports.index = function(req, res){
	var y = { 
		"user" : "/* Hello World program */\r\n\r\n#include<stdio.h>\r\n\r\nmain()\r\n{\r\n    printf(\"Hello World\");\r\n    return 0;\r\n}"
	};
	res.type('json');
	var x = JSON.stringify(y);
	res.redirect('/test?x='+x+"&c="+"10"); 
};