
var path = require("path");
var http = require("http");
var express = require("express");
var socketIO = require("socket.io");
var victor = require("victor");

var publicPath = path.join(__dirname, '../client');
var port = process.env.PORT || 2000;//2000 for testing
var app = express();
var server = http.createServer(app);
var io = socketIO(server);
app.use(express.static(publicPath));

var players = [];

server.listen(port, function(){
	//we are saying that the function that we are passing into listen prints the statement below
	console.log("Server Started on port "+ port +"!");
});

io.on('connection', function(socket) {
    console.log('someone conencted, Id: ' + socket.id);
    var player = {};
    var flowers = {};
    
    socket.on("imReady", (data) => {
        player = new Player(socket.id, data.name,  Math.random() * mapSize,0, 100);
        players.push(player);

        socket.emit("yourId", {id: player.id});
        socket.broadcast.emit('newPlayer', player.getInitPack());

        socket.emit("initPack", {initPack: getAllPlayersInitPack()});
    });

    socket.on("inputData", (data) => {
        player.mouseX = data.mouseX;
        player.mouseY = data.mouseY;
        player.size += data.sizeChange;
        player.angle = data.angle;
        player.distXToMouse = data.distXToMouse;
        player.isFlipped = data.isFlipped;
        player.windowWidth = data.windowWidth;
        player.windowHeight = data.windowHeight;
    })

    socket.on("commandData", (data) => {
    	player.size += data.sizeChange;
    	player.speed += data.speedChange;
    })

    socket.on("disconnect", () => {
        io.emit('someoneLeft', {id: socket.id});


        players = players.filter((element) => element.id !== socket.id);
    });

})

//leg has a total range of 20% of the turtle
var upperLegBound = 0.025;
var lowerLegBound = -0.075;

var detectionRange = 0.6; //mouse moves player when it is greater than 60% of the player size
var mapSize = 6000;

var Player = function(id, name, x, y, size){
	this.id = id;
	this.name = "";
	this.x = x;
	this.y = y;
	this.size = size;
	this.speed = 1;
	this.velY = 0;
	this.legOffsetX = 0;
	this.legOffsetY = 0;
	this.legDirX = 1;
	this.isFlipped;
	this.frontLegUp = 1;
	this.doMovement = true;
	this.angle = 0;
	this.distXToMouse = 0;

	this.shellType = "Box";

	this.windowWidth;
	this.windowHeight;

	this.update = function(){
		//server sided so inspect cant hack it
		this.legOffsetX+=this.speed*this.legDirX;
		if(this.speed*this.doMovement === 0){
			this.legOffsetX = 0;
			this.legOffsetY = 0;
			this.legDirX = 1;
			this.frontLegUp = true;
		}
		if(this.legOffsetX>upperLegBound*this.size){
			this.legOffsetX=(upperLegBound*this.size);
			this.legDirX = -1;
			this.frontLegUp = !this.frontLegUp;
		}else if(this.legOffsetX<lowerLegBound*this.size){
			this.legOffsetX=(lowerLegBound*this.size);
			this.legDirX = 1;
			this.frontLegUp = !this.frontLegUp;
		}

    	if(this.distXToMouse<this.size*detectionRange){
			this.doMovement = false;
		} else{
			this.doMovement = true;
		}

		if(this.doMovement){
			if (!(this.isFlipped)) {
				if(this.x < mapSize){
					this.x += this.speed;
				}
			} else{
				if(this.x > 0){
					this.x -= this.speed;
				}
			}
		}
	}
	this.getInitPack = function () { //base information that can be updated
		return {
			id: this.id,
			name: this.name,
			x: this.x,
			y: this.y,
			size: this.size,
		}
	}
	this.getUpdatePack = function () {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            size: this.size,
            doMovement: this.doMovement,
            legOffsetX: this.legOffsetX,
            frontLegUp: this.frontLegUp,
            isFlipped: this.isFlipped,
            shellType: this.shellType,
            angle: this.angle,
        }
    }
    
	return this;
}

function getAllPlayersInitPack() {
    var initPack = [];
    for(var i in players) {
        initPack.push(players[i].getInitPack());
    }
    return initPack;
}

setInterval(() => {
    var updatePack = [];

    for(var i in players) {
        players[i].update();
        updatePack.push(players[i].getUpdatePack());
    }

    io.emit("updatePack", {updatePack});
}, 1000/35)

var Plant = function(x, height){
	this.x = x;
	this.height = height;
	this.hasFlower = true;
	this.flower = new Flower(x, -height);
	return this;
}

var Flower = function(x,y){
	this.x = x;
	this.y = y;
	this.xp = 5+Math.random()*5;
	this.size = 150;
	return this;
}

var Leaf = function(x, y, isFlipped){
	this.x = x;
	this.y = y;
	this.isFlipped = isFlipped;
	this.size = 100;
	return this;
}