var db = require('./modules/db.js');

var spam = {};

function selectSpam() {
//	judge();
	genUserCata();
//	bayesian();
//	select();
//	baseOnRefer();	//refer: 24mail
//	baseOnOldApi(); //old api: twitter/ajax_voteTwitter
//	baseOnAjaxNullRefer();	//ajax request but null refer
//	baseOnCookie();	//questionable cookie
}

function genUserCata() {
/*
	var query = {
		'keys': ['uid', 'cata'],
//		'condition': {'refer':'http://24mail.chacuo.net'},
		'condition': {},
		'initial': {'count': 0},
		'reduce': function(obj, prev) {	prev.count++; }
	}
	db.group('user_visit', query, function(err, res){
		console.log(err, res)
	})
*/
	var map = function(){
		var key = {uid: this.uid, cata: this.cata};
		emit(key, {count: 1});
	}
	var reduce = function(k, val) {
		return Array.sum(val);
	}
	db.mapReduce('user_visit', map, reduce, function(err, res){
		console.log(err, res.length, res[0])
		db.insert('cata_preprocess', res, function(){console.log('congratulation~~~')})			
	})
}


function judge() {
	var bayes = {};
	db.find('bayesian', {}, {'_id':0}, function(res){
		for (var i=0, l=res.length; i<l; i++) {
			bayes[res[i].cata] = res[i].bayes_r;
		}
		var users = [];
		db.find('user_visit', {'refer':'http://24mail.chacuo.net'}, {'_id':0, 'uid':1}, function(res){
			var len = res.length;
			for (var i=0; i<len; i++) {
				if (users.indexOf(res[i].uid) == -1) users.push(res[i].uid);
			}
			console.log(users.length)
	//		for(var i in users) {
	//			db.find('user_visit', {'uid':users[i]}, {'_id':0, 'cata':1, 'uid':1}, function(res){
			db.find('user_visit', {'uid':{'$nin':users}}, {'_id':0, 'cata':1, 'uid':1, 'limit':10000}, function(res){
					var len = res.length;
				var norms = [];
				for (var i=0; i<len; i++) {
					if (norms.indexOf(res[i].uid) == -1) norms.push(res[i].uid);
				}
				console.log(norms.length);
				for(var i=0; i<norms.length; i++){
					db.find('user_visit', {'uid':norms[i]}, {'_id':0, 'cata':1, 'uid':1}, function(res){
					var len = res.length;
					var test = {};
					for (var i=0; i<len; i++) {
						res[i].cata in test ? test[res[i].cata]++ : test[res[i].cata] = 1;
					}
					var result = 0;
					for (var i in test) {
						result += bayes[i]*test[i]/len;
					}
					console.log(res[0].uid, result);
					db.insert('user_state', {'uid':res[0].uid, 'level':result});
					});
				}
			});
	//		}
		})
	})
}

function bayesian() {
	db.find('bayesian', {}, {'_id':0}, function(res){
		console.log(res.length)
		var spam_ratio, norm_ratio; 
		for (var i=0, l=res.length; i<l; i++) {
			if (res[i].cata == 'all') {
				spam_ratio = res[i].spam / (res[i].spam + res[i].normal);
				norm_ratio = 1 - spam_ratio;
				break;
			}
		}
		for (var i=0, l=res.length; i<l; i++) {
			var s = res[i].spam ? res[i].spam : 0;
			var n = res[i].normal ? res[i].normal : 0;
			var bayes_ratio = spam_ratio * s / (spam_ratio * s + norm_ratio * n);
			if (isNaN(bayes_ratio)) bayes_ratio = 0; 
			db.update('bayesian', {'cata': res[i].cata}, {'$set':{'bayes_r': bayes_ratio.toFixed(2)}})
		}
	})
}

function select(){
	db.find('user_visit', {'$or':[{'refer':'http://24mail.chacuo.net'}, {'url':'POST /twitter/ajax_voteTwitter HTTP/1.1'}]}, {'uid':1, '_id':0}, function(res){
		var spamers = [];
		for(var i=0, l=res.length; i<l; i++) {
			if (spamers.indexOf(res[i].uid) == -1)
				spamers.push(res[i].uid)
		}
		console.log('spamers num: '+spamers.length)
		db.find('user_visit', {'uid':{'$in':spamers}}, {'cata':1, 'uid':1, '_id':0}, function(res){
	//		var cata = {'user_num':spamers.length};
			var cata = {};
			for (var i=0, l=res.length; i<l; i++) {
				res[i].cata in cata ? cata[res[i].cata] ++ : cata[res[i].cata] = 1;
			}
			db.update('bayesian', {'cata': 'all'}, {'$set':{'spam': res.length}})
			db.update('bayesian', {'cata': 'visitors'}, {'$set':{'spam': spamers.length}})
			for (var c in cata) {
				db.update('bayesian', {'cata': c}, {'$set':{'spam': (cata[c]*100/res.length).toFixed(2)}})
			}
		});
		var normals = [];
		db.find('user_visit', {'uid':{'$nin':spamers}}, {'cata':1, 'uid':1, '_id':0}, function(res){
			var cata = {};
			for (var i=0, l=res.length; i<l; i++) {
				res[i].cata in cata ? cata[res[i].cata] ++ : cata[res[i].cata] = 1;
				if (normals.indexOf(res[i].uid) == -1)
					normals.push(res[i].uid)
			}
			db.update('bayesian', {'cata': 'all'}, {'$set':{'normal': res.length}})
			db.update('bayesian', {'cata': 'visitors'}, {'$set':{'normal': normals.length}})
			for (var c in cata) {
				db.update('bayesian', {'cata': c}, {'$set':{'normal': (cata[c]*100/res.length).toFixed(2)}})
			}
		});
	});
}
function baseOnRefer() {
	db.find('user_visit', {'refer':'http://24mail.chacuo.net'}, {'uid':1, '_id':0}, function(res){
		var spamers = [];
		console.log("============='refer':'http://24mail.chacuo.net'=================");
		for(var i=0, l=res.length; i<l; i++) {
			if (spamers.indexOf(res[i].uid) == -1)
				spamers.push(res[i].uid)
		}
		var cata = {'user_num':spamers.length};
		console.log('spamers num: '+spamers.length)
		db.find('user_visit', {'uid':{'$in':spamers}}, {'cata':1, 'uid':1, '_id':0}, function(res){
			console.log('total num: '+res.length);
			cata['vs_num'] = res.length;
			for (var i=0, l=res.length; i<l; i++) {
				res[i].cata in cata ? cata[res[i].cata] ++ : cata[res[i].cata] = 1;
			}
			spam['refer'] = cata;
			console.log(cata);
		})
	})
}

function baseOnOldApi() {
	db.find('user_visit', {'url':'POST /twitter/ajax_voteTwitter HTTP/1.1'}, {'uid':1, '_id':0}, function(res){
		var spamers = [];
		console.log("============='url':'POST /twitter/ajax_voteTwitter HTTP/1.1'==============");
		for(var i=0, l=res.length; i<l; i++) {
			if (spamers.indexOf(res[i].uid) == -1)
				spamers.push(res[i].uid)
		}
		var cata = {'user_num':spamers.length};
		console.log('spamers num: '+spamers.length)
		db.find('user_visit', {'uid':{'$in':spamers}}, {'cata':1, 'uid':1, '_id':0}, function(res){
			console.log('total num: '+res.length);
			cata['vs_num'] = res.length;
			for (var i=0, l=res.length; i<l; i++) {
				res[i].cata in cata ? cata[res[i].cata] ++ : cata[res[i].cata] = 1;
			}
			spam['oldapi'] = cata;
			console.log(cata);
		})
	})
}

function baseOnAjaxNullRefer() {
	db.find('user_visit', {'type':'ajax', 'refer':'-'}, {'uid':1, '_id':0}, function(res){
		var spamers = [];
		console.log("============={'type':'ajax', 'refer':'-'}==============");
		for(var i=0, l=res.length; i<l; i++) {
			if (spamers.indexOf(res[i].uid) == -1)
				spamers.push(res[i].uid)
		}
		var cata = {'user_num':spamers.length};
		console.log('spamers num: '+spamers.length)
		db.find('user_visit', {'uid':{'$in':spamers}}, {'cata':1, 'uid':1, '_id':0}, function(res){
			console.log('total num: '+res.length);
			cata['vs_num'] = res.length;
			for (var i=0, l=res.length; i<l; i++) {
				res[i].cata in cata ? cata[res[i].cata] ++ : cata[res[i].cata] = 1;
			}
			spam['oldapi'] = cata;
			console.log(cata);
		})
		
	})
} 

function baseOnCookie(){
	console.log("============={'uid':/%3b/}==============");
}

selectSpam();

