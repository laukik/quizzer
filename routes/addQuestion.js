exports.addQuestion = function (req, res){
	
	res.render('addquestion',{ title:req.session.userId, QID : req.session.Q});
}