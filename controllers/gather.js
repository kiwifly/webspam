var db = require('../modules/db.js');

exports.__handle = function(req, res, params) {
	res.writeHead(204 , {'Content-Type': 'text/plain'})
	res.end();

	var vtime = new Date;
	var s = new Date('2013/6/20');
	vtime = Math.floor((vtime - s)/1000)
//	db.insert('user_visit', {'uid': params.uid, 'cata': params.cata, 'vtime': vtime});
	db.update('user_vs', {'uid': params.uid, 'cata': params.cata}, {'$inc':{'num':1}});
}
