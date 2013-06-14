var spawn = require('child_process').spawn;
var args = process.argv.slice(2);
var tail;
console.log('* tailing stdin');
process.stdin.resume();
tail = process.stdin;
tail.setEncoding('utf8');
tail.on('data', function(chunk){
	console.log(chunk);
}).on('end', function(){
	console.log('end');
});
