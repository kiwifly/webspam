var mongodb = require('/usr/local/lib/node_modules/mongodb')
var connectNum = require('os').cpus().length
var ReplSet= mongodb.ReplSetServers
var Db = mongodb.Db
var Server = mongodb.Server
var replSet = new ReplSet([
	new Server('127.0.0.1', 30000),
	new Server('127.0.0.1', 30001)
], {rs_name: 'rs0'});
var db = new Db('test', replSet)

var isInit = false, queue = []

db.open(function(err, db) {
	if (err) {
		console.log(err)
		return
	}
	console.log('connected to database :: ' + 'test')
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
	collection.insert(query, {safe: true}, function(err, docs) {
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
	collection.update(query, set, {upsert: true}, function(err, docs) {
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
	collection.mapReduce(map, reduce, {out:{inline: 1}}, nextFn)
}

exports.insert = insert
exports.find = find
exports.findOne = findOne
exports.update = update
exports.group = group
exports.mapReduce = mapReduce
