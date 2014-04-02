exports.change_role = function (req, res){
	if( req.session.role == "creator"){
		req.session.role = "participant";
		res.redirect('/home_participant');
	}else{
		req.session.role = "creator";
		res.redirect('/home_creator');
	}
}