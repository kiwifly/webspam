var http = require('http')
var cluster = require('cluster')
var router = require('./router.js')
var numCPUs = require('./config.json').cpuNums || require('os').cpus().length
var port = require('./config.json').port

function start(route, port) {
	if (cluster.isMaster) {
		for (var i = numCPUs - 1; i >= 0; i--) {
			cluster.fork()
		}
		cluster.on('death', function(worker){
			console.log('worker ' + worker.pid + ' died!!!')
			cluster.fork()
		})
		cluster.on('exit', function(worker){
			console.log('worker ' + worker.process.pid + ' died at:', new Date)
		})
	} else {
		http.createServer(route).listen(port || 80)
		console.log('Server has started on ' + port + '.')
	}
}

start(router.route, port)