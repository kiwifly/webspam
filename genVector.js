var db = require('./modules/db.js');

var vectors = [];
db.distinct('bayesian', 'cata', {}, function(catas){
	vectors = catas.sort();
	db.distinct('user_state', 'uid', {}, function(res){
		var step = 1000, l = res.length, i = 0;
		while(i<l) {
			setTimeout(function(i){
				for (var t=0; t<step; t++, i++) {
					if (i>=l) return;
					db.find('user_visit', {'uid':res[i]}, {'uid':1, 'cata':1, 'num':1}, function(res){
						var total = 0, vec = [], vecs = {};
						for (var j=res.length-1; j>=0; j--) {
							if (res[j].cata == 'all' || res[j].cata == 'visitors') continue;
							total += res[j].num;
							vecs[res[j].cata] = res[j].num;
						}
						for (var k=0; k<vectors.length; k++) {
							if (vectors[k] == 'all' || vectors[k] == 'visitors') continue;
							if (!(vectors[k] in vecs)) 
								vec.push(0);
							else
								vec.push(parseFloat((vecs[vectors[k]]/total).toFixed(3)));
						}
						db.update('user_vect', {'uid':res[0].uid}, {'$set':{'vect':vec}});
					})
				}
			}(i), 1000*i);
			i = i + step;
		}
	})
})

