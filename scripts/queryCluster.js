var db = require('../modules/db.js')

db.find('cluster', {}, {'_id':0}, function(res){
	var len = res.length;
	for (var i=0; i<len; i++) {
		console.log(res[i].uids.length, res[i].type)
	}
	var k = 0;
	var query = function(k) {
		if (!res[k] && k < len) {
			return query(++k);
		}
		if (k >= len) return;
		db.find('user_vs', {'uid':res[k].type}, {'_id':0, 'cata':1, 'num':1}, function(doc){
			console.log(res[k].type)
			console.log(doc)
			if (k < len) {
				query(++k)
			}
		})
	}
	query(k);
})
