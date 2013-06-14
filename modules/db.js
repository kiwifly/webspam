var mongodb = require('/usr/local/lib/node_modules/mongodb')
var connectNum = require('os').cpus().length
var server = new mongodb.Server('127.0.0.1', 27017, {auto_reconnect: true}, connectNum)
var dbName = 'test'
var db = new mongodb.Db(dbName, server)

var isInit = false, queue = []

db.open(function(err, db) {
	if (err) {
		console.log(err)
		return
	}
	console.log('connected to database :: ' + dbName)
	isInit = true
	for (var i=0; i<queue.length; i++) {
		queue[i].fn.apply(null, queue[i].args)
	}
})

function insert(coll, query, nextFn) {
	// perform the {query} on the collection and invoke the nextFn when done
	if (!isInit) {
		queue.push({'fn': insert, 'args': arguments})
		return
	}
	var collection = db.collection(coll)
	collection.insert(query, {safe: true}, function(err, res) {
		if (err) {
			console.log(err)
			return
		}
		nextFn && nextFn(docs)
	})
}

function find(coll, query, options, nextFn) {
	if (!isInit) {
		queue.push({'fn': find, 'args': arguments})
		return
	}
	var collection = db.collection(coll)
	collection.find(query, options).toArray(function(err, docs) {
		if (err) {
			console.log(err)
			return
		}
		nextFn && nextFn(docs)
	})
}

function findOne(coll, query, nextFn) {
	if (!isInit) {
		queue.push({'fn': find, 'args': arguments})
		return
	}
	var collection = db.collection(coll)
	collection.findOne(query, {'_id': 0}, function(err, docs) {
		if (err) {
			console.log(err)
			return
		}
		nextFn && nextFn(docs)
	})
}

function update(coll, query, set, nextFn) {
	if (!isInit) {
		queue.push({'fn': update, 'args': arguments})
		return
	}
	var collection = db.collection(coll)
	collection.update(query, {$set: set}, {upsert: true}, function(err, res) {
		if (err) {
			console.log(err)
			return
		}
		nextFn && nextFn(docs)
	}) 
}

function group(coll, query, nextFn) {
	if (!isInit) {
		queue.push({'fn': group, 'args': arguments})
		return
	}
	var collection = db.collection(coll)
	collection.group(query.keys, query.condition, query.initial, query.reduce, query.finalize, query.command, nextFn);
}

function mapReduce(coll, map, reduce, nextFn) {
	if (!isInit) {
		queue.push({'fn': mapReduce, 'args': arguments})
		return
	}
	var collection = db.collection(coll)
	collection.mapReduce(map, reduce, {out:{inline: 1}, finalize: nextFn})
}

exports.insert = insert
exports.find = find
exports.findOne = findOne
exports.update = update
exports.group = group
exports.mapReduce = mapReduce
