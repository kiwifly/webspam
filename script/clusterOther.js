var db = require('./modules/db.js');

var c2 = [
  [ '44b52d153db36f9a695e9ae2f92c7386', 9 ],
  [ '16b5f4815d2419addfdb980a4d3ad682', 10 ],
  [ 'eddcd90411883023d06dd6a6d807b124', 15 ],
  [ '6ab626d5b51157803a10542c87910669', 12 ],
  [ 'eeee4615beb8fd73716e0f20fe208b3d', 9 ],
  [ '483d122784221e950091eb9820fd4861', 7 ],
  [ 'e3494efdd31c6934d94e0aeac7ddf86e', 7 ],
  [ 'bf6fd23a4f9efe76a2e477e5ad3139de', 13 ],
  [ 'a5798230a7823ac3ec2f9efcdce15a51', 7 ],
  [ '2e2f88005ff8f714ee8fba456474f9d3', 7 ]
];

var v1 = {}, v2 = {}, count=20, ret = [];

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

var clus = {};
function genCluster(c2) {
	var v2 = {}, k = 10;
	for (var i=c2.length-1; i>=0; i--) {
		clus[c2[i][0]] = [];
		db.find('user_vect', {'uid':c2[i][0]}, {'_id':0}, function(doc){
			v2[doc[0].uid] = doc[0].vect;
			k--;
			if(k<=0) otherCluster();
		})
	}
	var count = function(arr){
		var ret = 0;
		for(var i=arr.length-1; i>=0; i--){
			if(arr[i]!=0) ret++;
		}
		return ret;
	}

	var otherCluster = function(){
		db.find('cluster', {'type':'other'}, {'_id':0}, function(res){
			var uids = res[0].uids;
			for (var i=0,l=uids.length; i<l; i++) {
				db.find('user_vect', {'uid':uids[i][0]}, {'_id':0}, function(doc){
					var flag = 0;
					for (var k in v2) {
						var s = vectSim(doc[0].vect, v2[k]);
						if (s > 0.1) flag = 1;
					}
					if (flag == 0 && count(doc[0].vect) > 4) {
						console.log([doc[0].uid, count(doc[0].vect)]);
						v2[doc[0].uid] = doc[0].vect;
					}
				})
			}	
		})
	}

	var cluster = function(){
		db.find('user_vect', {}, {'_id':0}, function(res){
			var slice = function(i, l) {
				for(;i<l; i++) {
					var sim = 0, pos = '';
					for(var k in v2) {
						var s = vectSim(res[i].vect, v2[k]) 
						if (s > sim) {
							sim = s;
							pos = k;
						}
					}
					if (sim > 0.8) {
						clus[pos].push([res[i].uid, sim])
						db.update('cluster', {'type':pos}, {'$push':{'uids':[res[i].uid, sim]}})
					} else {
						db.update('cluster', {'type':'other'}, {'$push':{'uids':[res[i].uid, sim, pos]}})	
					}
				}
			}
			for (var i=0, len=res.length; i<len; ) {
				l = i + 1000;
				if (l > len) l = len;
				setTimeout(function(i, l){slice(i, l);}(i, l), l)
				i = l;
			}
		})
	}
}

genCluster(c2);
