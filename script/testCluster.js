var db = require('./modules/db.js');

var c1 = [
  [ 'b071248bb1d31354627a8f62319c34b1', 11 ],
  [ '155b199744d458a878396166496a0d62', 7 ],
  [ '4cf89186b4a6aa4a5d7f7e342860dce3', 8 ],
  [ '166c953ee9604a511330283cb312e29e', 7 ],
  [ '207cb4a2da86086003c4684950879f5b', 7 ],
  [ '59d1015367560ac2121e43100cb51163', 9 ],
  [ '91438d8cc6a9bcdef3470813cde0f245', 7 ],
  [ '23f43e6f928135c13b399e05d1d9ad6e', 7 ],
  [ '8e4c0325f2aff4dd76b4dc2f8f4316fc', 7 ],
  [ 'a5798230a7823ac3ec2f9efcdce15a51', 7 ]
];
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
  [ '2e2f88005ff8f714ee8fba456474f9d3', 7 ],
  [ 'f4cb061814c85ac3a6cdfa2b99bc603e', 5 ],
  [ '9bf4a539801453e72fb1b33bef3398c0', 5 ],
  [ 'a44ce34ca61f003aa90cb2f4db1559c5', 6 ],
  [ 'd432a92bcc0483f9aafc378e80d3973a', 6 ],
  [ '66db9139417f4998dd87eff168d6be02', 8 ]
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

function testCluster(c1, c2) {
	var getV = function(c, v, cbk){
		for (var i=c.length-1; i>=0; i--) {
			db.find('user_vect', {'uid':c[i][0]}, {'_id':0}, function(doc){
				v[doc[0].uid] = doc[0].vect;
				count--;
				if(count<=0) cbk();
			})
		}
	}
	var cbk = function(){
		for(var i in v1) {
			var flag = 0;
			for(var j in v2) {
				var sim = vectSim(v1[i], v2[j]);
				if(sim > 0.1){
					flag = 1;
					break;
				//	console.log(i, j, sim);
				}
			}
			if (flag == 0) {
				console.log(i)
				ret.push(i)
			}
		}
		for (var j in v2) ret.push(j)
		console.log(ret)
	}
	getV(c1, v1, cbk);
	getV(c2, v2, cbk);
}
//testCluster(c1, c2);

var clus = {};
function genCluster(c2) {
	var v2 = {}, k = c2.length;
	for (var i=c2.length-1; i>=0; i--) {
		clus[c2[i][0]] = [];
		db.find('user_vect', {'uid':c2[i][0]}, {'_id':0}, function(doc){
			v2[doc[0].uid] = doc[0].vect;
			k--;
			if(k<=0) cluster();
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
					if (sim > 0.7) {
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
