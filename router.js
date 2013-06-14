var qs = require('querystring')

function route(req, res) {
	var url = req.url.split('?'),
		path = url[0].substr(1),
		params = qs.parse(url[1])
	/*
	url 格式 [/ 地址/...]模块文件名?参数 
	*/
	var mod = require('./controllers/' + path + '.js')
	mod.__handle(req, res, params)
}

exports.route = route
