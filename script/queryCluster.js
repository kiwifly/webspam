var db = require('./modules/db.js')

db.find('cluster', {}, {'_id':0}, function(res){
	for (var i=0; i<res.length; i++) {
		console.log(res[i].uids.length, res[i].type)
	}
})
