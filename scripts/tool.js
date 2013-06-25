exports.vectSim = function(v1, v2) {
	var l = v1.length, sim = 0, v1_s = 0, v2_s = 0;
	for (var i=0; i<l; i++) {
		sim += v1[i] * v2[i];
		v1_s += v1[i] * v1[i];
		v2_s += v2[i] * v2[i];
	}
	sim = sim/(Math.sqrt(v1_s) * Math.sqrt(v2_s));
	return parseFloat(sim.toFixed(4));
}

exports.count = function(arr){
	var ret = 0;
	for(var i=arr.length-1; i>=0; i--){
		if(arr[i]!=0) ret++;
	}
	return ret;
}

