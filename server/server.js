
var path = require("path");
var http = require("http");
var express = require("express");
var socketIO = require("socket.io");
var victor = require("victor");

var publicPath = path.join(__dirname, '../client');
var port = process.env.PORT || 2000;//2000 for localhost testing
var app = express();
var server = http.createServer(app);
let io = socketIO(server);
app.use(express.static(publicPath));

var players = [];
var plants = [];

server.listen(port, function(){//when the server starts, generate tha map with this function
	var plant = {};
	for(let i = 0; i< (mapSize/100); i++){
		plant = new Plant(i, Math.random()*mapSize, (Math.random()*300)+200, true, true);
		plants.push(plant);
	}
	console.log("Server Started on port "+ port +"!");
});

io.on('connection', function(socket) {
    console.log('someone conencted, Id: ' + socket.id);
    var player = {};
    
    socket.on("imReady", (data) => { //player joins
        player = new Player(socket.id, data.name,  Math.random() * mapSize,0, 100);
        players.push(player);

        socket.emit("yourId", {id: player.id});
        socket.broadcast.emit('newPlayer', player.getInitPack());

        socket.emit("initPack", {initPack: getAllPlayersInitPack()});
        socket.emit("plantInitPack", {plantInitPack: getAllPlantsInitPack()});
    });

    socket.on("inputData", (data) => {
        player.mouseX = data.mouseX;
        player.mouseY = data.mouseY;
        player.angle = data.angle;
        player.distXToMouse = data.distXToMouse;
        player.isFlipped = data.isFlipped;
        player.windowWidth = data.windowWidth;
        player.windowHeight = data.windowHeight;
    })

    // socket.on("requestData", (data) => {
    //     player.xp += data.xpChange;
    //     // plants[data.plantIndex].hasFlower = data.hasFlower;
    // })

    socket.on("commandData", (data) => {
    	player.size += data.sizeChange;
    	player.speed += data.speedChange;
    	
    	if(data.setAbility){
    		player.whatAbility = data.whatAbility;
    		switch(player.whatAbility){
    		case "BoxRoll":
    			player.abilityTimer = 40;
    			break;
    		case "DomeRoll":
    			player.abilityTimer = 40;
    			break;
    		case "SpikeRoll":
    			player.abilityTimer = 40;
    			break;
    		case "Hide":
    			player.abilityTimer = 120;
    			break;
    		default:
    			console.log("Ability doesnt exist");
    			player.abilityTimer = 0;
    			break;
    		}
    		player.doingAbility = true;
    		player.bodyAngle = 0;
    	}
    })

    socket.on("disconnect", () => {
        io.emit('someoneLeft', {id: socket.id});

        players = players.filter((element) => element.id !== socket.id);
    });

})

//leg has a total range of 20% of the turtle
var upperLegBound = 0.025;
var lowerLegBound = -0.075;

var detectionRange = 0.4; //mouse moves player when it is greater than 60% of the player size
var mapSize = 6000;

var Player = function(id, name, x, y, size){
	this.id = id;
	this.name = "Boxt.io";
	this.x = x;
	this.y = y;

	this.doingAbility = false;
	this.abilityTimer = 100;
	this.whatAbility;
	this.abilitySet = [];
	this.bodyAngle = 0;

	this.xp = 3;
	this.upgrade = 1; //player on first upgrade
	this.targetXp = 10;
	this.size = size;
	this.speed = 1.5;
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

	this.handleXp = function(){
		var headX;
		var headY;
		var range;
		if(!this.isFlipped){
    		headX = this.x+this.size*0.6;
    	} else{
    		headX = this.x-this.size*0.6;
    	}
    	headY = this.y-this.size*0.44;
    	range = this.size*0.1;

		for(let i in plants){
			if(Math.sqrt(Math.pow(headX-plants[i].flower.x,2)+Math.pow(headY-plants[i].flower.y,2))< (range+plants[i].flower.size/2)){
				if(plants[i].hasFlower){
					plants[i].hasFlower = false;
					this.xp+= plants[i].flower.xp;
					sendPlantUpdate();
				} 
			}
			for(let j in plants[i].leaves){
				if(Math.sqrt(Math.pow(headX-plants[i].leaves[j].x,2)+Math.pow(headY-plants[i].leaves[j].y,2))< (range+plants[i].leaves[j].size/2)){
					if(plants[i].hasLeaf[j]){
						plants[i].hasLeaf[j] = false;
						this.xp+= plants[i].leaves[j].xp;
						sendPlantUpdate();
					} 
				}
			}
		}
		
		if(this.xp>this.targetXp){
			if(this.upgrade === 1){
				this.abilitySet[0] = "Hide";
				this.size+=20;
				this.xp = this.xp-this.targetXp;
				this.upgrade = 2;
				this.targetXp += 10;
			} else if(this.upgrade === 2){
				this.abilitySet[1] = "BoxRoll";
				this.shellType = "Box";
				this.size+=20;
				this.xp = this.xp-this.targetXp;
				this.upgrade = 3;
				this.targetXp += 10;
			} else if(this.upgrade === 3){
				this.abilitySet[1] = "DomeRoll";
				this.shellType = "Dome";
				this.size+=20;
				this.xp = this.xp-this.targetXp;
				this.upgrade = 4;
				this.targetXp += 10;
			} else if(this.upgrade === 4){
				this.abilitySet[1] = "SpikeRoll";
				this.shellType = "Spike";
				this.size+=20;
				this.xp = this.xp-this.targetXp;
				this.upgrade = 5;
				this.targetXp += 10;
			} else if(this.upgrade === 5){
				console.log("Grow Turtle"+this.xp);
        		this.upgrade = 2;
        		this.size+=40;
        		this.xp = this.xp-this.targetXp;
        		this.upgrade = 2;
        		this.targetXp += 20;
        	}
        }
	}

	this.animateLegs = function(){
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
	}

	this.playAbility = function(whatAbility){
		switch(whatAbility){
		case "BoxRoll":
			this.doMovement = false;
			this.bodyAngle+= (this.speed*6)/100;
			if (!(this.isFlipped)) {
				if(this.x < mapSize){
					this.x += this.speed*6;
				}else{
					this.doingAbility = false;
				}
			} else{
				if(this.x > 0){
					this.x -= this.speed*6;
				}else{
					this.doingAbility = false;
				}
			}
			break;
		case "DomeRoll":
			this.doMovement = false;
			this.bodyAngle+= (this.speed*6)/100;
			if (!(this.isFlipped)) {
				if(this.x < mapSize){
					this.x += this.speed*6;
				}else{
					this.doingAbility = false;
				}
			} else{
				if(this.x > 0){
					this.x -= this.speed*6;
				}else{
					this.doingAbility = false;
				}
			}
			break;
		case "SpikeRoll":
			this.doMovement = false;
			this.bodyAngle+= (this.speed*6)/100;
			if (!(this.isFlipped)) {
				if(this.x < mapSize){
					this.x += this.speed*6;
				}else{
					this.doingAbility = false;
				}
			} else{
				if(this.x > 0){
					this.x -= this.speed*6;
				}else{
					this.doingAbility = false;
				}
			}
			break;
		case "Hide":
			this.doMovement = false;
			break;
		default:
			break;
		}
		this.abilityTimer -= 1;
		if(this.abilityTimer <= 0){
			this.doingAbility = false;
		}
	}

	this.update = function(){
		if(this.distXToMouse<this.size*detectionRange){
			this.doMovement = false;
		} else{
			this.doMovement = true;
		}
    	this.handleXp();
		this.animateLegs();
		if(this.doingAbility){
			this.playAbility(this.whatAbility); //this can overwrite anything
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
            xp: this.xp,
            upgrade: this.upgrade,
            targetXp: this.targetXp,
            size: this.size,
            doMovement: this.doMovement,
            legOffsetX: this.legOffsetX,
            frontLegUp: this.frontLegUp,
            isFlipped: this.isFlipped,
            shellType: this.shellType,
            angle: this.angle,
            bodyAngle : this.bodyAngle,
            doingAbility: this.doingAbility,
            whatAbility: this.whatAbility,
            abilitySet: this.abilitySet,
        }
    }
    
	return this;
}

function getAllPlayersInitPack() {
    let initPack = [];
    for(let i in players) {
        initPack.push(players[i].getInitPack());
    }
    return initPack;
}

setInterval(() => {
    var updatePack = [];

    for(let i in players) {
        players[i].update();
        updatePack.push(players[i].getUpdatePack());
    }

    io.emit("updatePack", {updatePack});
}, 1000/35)

var Plant = function(id, x, height, hasFlower, hasLeaf){
	this.id = id;
	this.x = x;
	this.height = height;
	this.hasFlower = true;
	this.flower = new Flower(x, -height);
	this.hasLeaf = [];
	this.leaves = [];
	var numLeaves = (height-(height%75))/75;
	var doLeafFlip;
	if(this.id%2 == 1){
		doLeafFlip = false;
	} else{
		doLeafFlip = true;
	}
	for(let i = 0; i<numLeaves; i++){
		if(!(doLeafFlip)){
			this.leaves[i]=new Leaf(x+50, -((i+0.5)*75), doLeafFlip);
		} else{
			this.leaves[i]=new Leaf(x-50, -((i+0.5)*75), doLeafFlip);
		}
		this.hasLeaf[i] = true;
		doLeafFlip = !doLeafFlip;
	}

	this.getInitPack = function () { //base information that can be updated
		return {
			id: this.id,
			x: this.x,
			height: this.height,
			hasFlower: this.hasFlower,
			hasLeaf: this.hasLeaf,
		}
	}
	this.getUpdatePack = function () {
		return {
			id: this.id,
			hasFlower: this.hasFlower,
			hasLeaf: this.hasLeaf,
		}
	}
	return this;
}

var Flower = function(x,y){
	this.x = x;
	this.y = y;
	this.xp = 10+Math.random()*5;
	this.size = 150;
	return this;
}

var Leaf = function(x, y, isFlipped){
	this.x = x;
	this.y = y;
	this.isFlipped = isFlipped;
	this.xp = 5;
	this.size = 100;
	return this;
}

function getAllPlantsInitPack() {
    var plantInitPack = [];
    for(let i in plants) {
        plantInitPack.push(plants[i].getInitPack());
    }
    return plantInitPack;
}

function sendPlantUpdate() {
    var plantUpdatePack = [];

    for(let i in plants) {
        // plants[i].update();
        plantUpdatePack.push(plants[i].getUpdatePack());
    }

    io.emit("plantUpdatePack", {plantUpdatePack});
}
