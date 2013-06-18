var db = require('./modules/db.js');

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

var c1={}, c2={}, c3={};
function genCenter(){
	var k = 10;
	var c = {};
	var a = [];
	var count = function(arr){
		var ret = 0;
		for(var i=arr.length-1; i>=0; i--){
			if(arr[i]!=0) ret++;
		}
		return ret;
	}
	db.distinct('user_state', 'uid', {}, function(res){
		console.log(res.length)
		function getC(){
			var r = Math.floor(Math.random()*res.length);
			console.log(r, res[r])
			db.find('user_vect', {'uid':res[r]}, {'_id':0}, function(doc){
				doc = doc[0]
				if(count(doc.vect)>6) {
					console.log(count(doc.vect), k)
					var flag = 0;
					for(var i in c) {
						if (vectSim(doc.vect, c[i]) > 0.1){
							flag = 1;
							break;
						}
					}
					if (flag == 0) {
						k--;
						a.push([doc.uid, count(doc.vect)])
						c[doc.uid] = doc.vect;
					}
				}
				if (k > 0)
					getC();
				else
					console.log(a)
			})
		}
		getC();
	})
}
genCenter();
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
