var http = require('http')
var opts = {
	host: 'cdjspam.meilishuo.com',
	port: 80,
	path: '/gather?uid=fjeiw&cata=test',
	method: 'GET'
}
for (var i=0; i<10000; i++) {
	(function() {
		var req = http.request(opts, function(res){
			console.log(res.statusCode);
		})
		req.end()
	})()
}
