var fs = require('fs');
//var db = require('./modules/replicasets.js');
var db = require('./modules/db.js');
var log = 'nginx-2013-05-31_santorini_mm';
var logFd;
//options for read
var buf, 
	logSize, 
	start = 0,
	length,
	offset = 0,
	logArr = '',
	LENGTH = 4 * 1024 * 1024; //each read length, 1M
//read file info
fs.stat(log, function(err, stats){
	if(err)	throw err;
	logSize = stats.size;
	fs.open(log, 'r', function(err, fd){
		if (err) throw err;
		logFd = fd;
		length = LENGTH < (logSize - offset) ? LENGTH : (logSize - offset);
		buf = new Buffer(length);
		readLog();
	});
});
//read log
function readLog(){
	fs.read(logFd, buf, start, length, offset, function(err) {
		if (err) throw err;
		//split by line
		logArr = buf.toString('utf8').split('\n');
		var last = false;
		if(offset + length < logSize) {
			//the last line not complete, throw off, get it next time
			last = logArr.pop();
		}
		//analyze logArr
		analyzeLog();
		//handle opts for later using
		if(last !== false) {
			offset += length - last.length;
			length = LENGTH < (logSize - offset) ? LENGTH : (logSize - offset);
			buf = new Buffer(length);
			//call recursion
			setTimeout(readLog, 1000);
		}
	});
}
//analyze log
function analyzeLog() {
	console.log('Analyzing ' + logArr.length + ' line log....')
	var ss = new Date;
	for (var i=0, l=logArr.length; i<l; i++) {
		var ret = analyzeLine(logArr[i]);
		if (ret)
			db.update('user_vs', ret, {'$inc': {'num': 1}});
	//	analyzeLine(logArr[i])
	}
	console.log('Spend time: ' + (new Date - ss));
}
//analyze line
/*	line eg:
	4373:[123.150.182.202] [-] [31/May/2013:00:17:12 +0800] [GET /group?frm=one_page HTTP/1.1] [200] [14888] [http://www.meilishuo.com/group/25390836] [UNTRUSTED/1.0/AJSC/1.5] [-] [MEILISHUO_GLOBAL_KEY=ab3bf25040d1b643c13053022385307c; SEASHELL=fMqQCFGnZH2aBkReBRyPAg==; PHPSESSID=q0vuh42bq96mvv1gqk3g6bk202; santorini_mm=411bebf3c708fcdca1b2db5dfb1aee9c; CHANNEL_FROM=0] [0.031] [172.16.0.161:8888] [0.031] [SEASHELL=0890CA7C7D64A7515E44069A028F1C05]
*/
function analyzeLine(line) {
	var arr = line.split('] [');
	if (arr.length == 1) {
		return false;
	}
	var ret = {};
	try{
		ret['uid'] = arr[9].split('santorini_mm=')[1].split(';')[0].split('%3b')[0];	//userId
	}catch(e){
		console.log('Error:', line, arr, arr[9])
	}
	getCata(arr[3], ret);	//type & catalog & method
	return ret;
}
//generate type & catalog & method by url
function getCata(url, ret) {
	var opts = url.split(' ');
	if (opts[1].indexOf('/aj/') > -1 || opts[1].indexOf('/aw/') > -1 || opts[0] == 'POST') {
		ret['type'] = 'ajax';
		/*replace('http://www.meilishuo.com', '') is to filter spam action... */
		ret['cata'] = opts[1].replace('/aj/', '').replace('/aw/', '').replace('http://www.meilishuo.com', '').split('?')[0];
	} else {
		ret['type'] = 'page';
		ret['cata'] = opts[1].split('/')[1].split('?')[0];
	}
	ret['method'] = opts[0];
}
