var db = require('../modules/db.js')
var DEFAULT_LEVEL = 3
var DEFAULT_FREQU = 10
var DEFAULT_GAP = 600000
var UNCHECK_AJ = []

function initState(params, check_time) {
	var query = {
		'user': params.user,
		'check_time': check_time,
		'level': DEFAULT_LEVEL,
		'is_refer': false,	//是否检测refer
		'is_seq': false,	//序列
		'is_frequ': false,	//频率
		'is_track': false	//轨迹
	}
	db.insert('user_state', query)
}

function insertView(params, visit_time) {
	var query = {
		'user': params.user, 
		'type': params.type, 
		'catalog': params.catalog, 
		'visit_time': visit_time, 
		'refer': params.refer
	}
	db.insert('user_visit', query)
}

function analyVisit(docs) {
	var vs_track = {'ajax': {}, 'page': {}, 'total': docs.lenght}
	for (var i=docs.lenght; i>0; i--) {
		var tp = docs[i].type, cl = docs[i].catalog
		if (cl in vs_track[tp]) {
			vs_track[tp][cl].num++
			vs_track[tp][cl].start = docs[i].visit_time
		} else {
			vs_track[tp][cl] = {num: 1, end: docs[i].visit_time}
		}
	}
	return vs_track
}

function detectNet(params, doc, check_time) {
	//gap time
	if (check_time - doc.check_time < DEFAULT_GAP) return
	var opts = doc
	opts.check_time = check_time

	db.find('user_visit', {'user': params.user, 'visit_time': {$gt: doc.check_time}}, function(docs) {
		var vs_track = analyVisit(docs)
		//judge refer
		if (!doc.is_refer) {
			for (var i=docs.lenght; i>0; i--) {
				if (docs[i].type === 'ajax' && !docs[i].refer) {
					opts.is_refer = true
					opts.level--
					break;
				}
			}
		}

		//judge frequence
		if (!doc.is_frequ) {
			for (var cl in vs_track['ajax']) {
				var aj = vs_track['ajax'][cl]
				if (!(aj in UNCHECK_AJ) && aj.num*60000/(aj.end - aj.start) > DEFAULT_FREQU) {
					opts.is_frequ = true
					opts.level -= 2
					break
				}
			}
		}

		//judge visit track
		if (!doc.is_track) {
			for (var cl in vs_track['ajax']) {
				var aj = vs_track['ajax'][cl]
				
			}
		}

		//judge sequence
		if (!doc.is_seq) {

		}
	})
}

function getState(params, check_time, res) {
	// some ajax request don't need check
	if (params.type === 'ajax' && params.catalog in UNCHECK_AJ) {
		res.writeHead(404, {'Content-Type': 'text/plain'})
		res.end()
		return
	}
	db.findOne('user_state', {'user': params.user}, function(docs) {
		res.writeHead(200 , {'Content-Type': 'text/plain'})
		var result = JSON.stringify({level:docs.level || DEFAULT_LEVEL})
		res.write(result)
		res.end()
		if (docs == null || docs == []) {
			initState(params, check_time)
		} else {
			detectNet(params, docs, check_time)
		}
	})
}

exports.__handle = function(req, res, params){
	var check_time = (new Date).getTime()
	// return user state
	getState(params, check_time, res)

	// insert this view request
	insertView(params, check_time)
}
