var http = require('http')
var cryto = require('crypto')
var opts = {
	host: 'testwww.ot.meilishuo.com',
	port: 80,
	path: '/welcome',
	method: 'GET',
	agent: false,
	headers: {}
}
for (var i=0; i<10; i++) {
	var mm = cryto.createHash('md5').update(Math.random(100).toString()).digest('hex'); 
	(function() {
		opts.headers.cookie = 'MEILISHUO_MM='+mm+';';
		var req = http.request(opts, function(res){
			console.log(opts.headers.cookie, res.statusCode);
		})
		req.end()
	})()
}
