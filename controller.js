
function Controller(){

}

Controller.prototype = {
	setRnR : setRnR,
	readData : readData,
	recordData : recordData,
	send : send
}

function setRnR(req, res){
	this.req = req
	this.res = res
}
