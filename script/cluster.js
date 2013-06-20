var db = require('../modules/db.js');

function vectSim(v1, v2) {
	var l = v1.length, sim = 0, v1_s = 0, v2_s = 0;
	for (var i=0; i<l; i++) {
		sim += v1[i] * v2[i];
		v1_s += v1[i] * v1[i];
		v2_s += v2[i] * v2[i];
	}
	sim = sim/(Math.sqrt(v1_s) * Math.sqrt(v2_s));
	return parseFloat(sim.toFixed(4));
}
var count = function(arr){
	var ret = 0;
	for(var i=arr.length-1; i>=0; i--){
		if(arr[i]!=0) ret++;
	}
	return ret;
}

function genCenter(){
	var c = {};
	var a = [];
	var others = [];
	db.distinct('user_state', 'uid', {}, function(res){
		console.log(res.length)
		var len = res.length, k = 0;
		function getC(){
	//		var r = Math.floor(Math.random()*res.length);
			db.find('user_vect', {'uid':res[k]}, {'_id':0}, function(doc){
				doc = doc[0]
				if(count(doc.vect)>1) {
					var flag = 0;
					for(var i in c) {
						var sim = vectSim(doc.vect, c[i]);
						if (sim > 0.3) {
							flag = 1;
						}
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
			if (s > 0.6) {
				db.update('cluster', {'type':pos}, {'$push':{'uids':[doc.uid, s]}});
			} else {
				left.push([doc.uid, s, pos]);
			}
			k++;
			if (k < len) {
				cluster(rate);
			} else {
				console.log(left.length)
			}
		});
	}
	cluster(rate)
}

function clusterOther1(others, c, rate){
	console.log(others.length, rate)
	if (rate > 0.45 || others.length == 0) {
		console.log('=====', others)
		db.update('cluster', {'type':'other'}, {'$set':{'uids':others}})
		return;
	}
	var k = 0, a = [], len = others.length, left = [];
	var getC = function(rate) {
		db.find('user_vect', {'uid':others[k]}, {'_id':0}, function(doc){
			doc = doc[0]
			if(count(doc.vect)>4) {
				var flag = 0, s = 0, pos = '';
				for(var i in c) {
					var sim = vectSim(doc.vect, c[i]);
					if (sim > rate) {
						flag = 1;
						if (sim > s) {
							s = sim;
							pos = i;
						}
					}
				}
				if (s > 1-rate) {
					db.update('cluster', {'type':pos}, {'$push':{'uids':[doc.uid, s]}});
				} else if (flag != 0) {
					rate > 0.35 ? left.push([doc.uid, s]) : left.push(doc.uid);
				}
				if (flag == 0) {
					a.push([doc.uid, count(doc.vect)])
					c[doc.uid] = doc.vect;
					db.insert('cluster', {'type':doc.uid, 'uids':[]});
				}
			} else {
				rate > 0.35 ? left.push([doc.uid, s]) : left.push(doc.uid);
			}
			k++;
			if (k < len) {
				getC(rate);
			} else {
				console.log(a.length, a)
				clusterOther(left, c, rate+0.1);
			}
		});
	}
	getC(rate)
}

/*
function cluster(){
	var clusters = {};
	var gathered = [];
	var num = 0;
	var ss = new Date;
	db.find('user_vect', {}, {'_id':0}, function(res){
		for (var i=0, l=res.length; i<l; i++){
			if(i%100 ==0) console.log(new Date - ss)
			if (gathered.indexOf(res[i].uid) > -1) continue;
			clusters[res[i].uid] = [];
			num++;
			for (var j=i; j<l; j++){
				if (gathered.indexOf(res[j].uid) > -1) continue;
				var sim = vectSim(res[i].vect, res[j].vect);
				if (sim > 0.7) {
					gathered.push(res[j].uid);
					clusters[res[i].uid].push([res[j].uid, sim])
				}
			}
		}
		console.log(clusters, num)
	})
}
*/
