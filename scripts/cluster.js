var db = require('../modules/db.js');
var tool = require('./tool.js');

var count = tool.count, vectSim = tool.vectSim;

function genCenter(){
	var c = {};
	var a = [];
	var others = [];
	db.distinct('user_vect', 'uid', {}, function(res){
		var len = res.length, k = 0;
		function getC(){
			db.find('user_vect', {'uid':res[k]}, {'_id':0}, function(doc){
				doc = doc[0]
				if(count(doc.vect)>1) {
					var flag = 0;
					for(var i in c) {
						var sim = vectSim(doc.vect, c[i]);
						if (sim > 0.2) flag = 1;
					}
					if (flag == 0) {
						a.push([doc.uid, count(doc.vect)])
						c[doc.uid] = doc.vect;
						db.insert('cluster', {'type':i, 'uids':[]});
					} else {
						others.push(doc.uid);
					}
				} else {
					others.push(doc.uid);
				}
				k++;
				if (k < len) {
					getC();
				} else {
					console.log(a.length, a, others.length)
					clusterOther(others, c, 0.2);
				}
			})
		}
		getC();
	})
}
genCenter();

function clusterOther(others, c, rate) {
	var k = 0, len = others.length, left = [];
	var cluster = function(){
		db.find('user_vect', {'uid':others[k]}, {'_id':0}, function(doc){
			doc = doc[0]
			var s = 0, pos = '';
			for(var i in c) {
				var sim = vectSim(doc.vect, c[i]);
				if (sim > s) {
					s = sim;
					pos = i;
				}
			}
			if (s > 1-rate) {
				db.update('cluster', {'type':pos}, {'$push':{'uids':[doc.uid, s]}});
			} else {
				left.push([doc.uid, s, pos]);
			}
			k++;
			if (k < len) {
				cluster();
			} else {
				console.log(left.length)
			}
		});
	}
	cluster()
}
