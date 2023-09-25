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
        player.headAngle = data.headAngle;
        player.distXToMouse = data.distXToMouse;
        player.isFlipped = data.isFlipped;
        player.windowWidth = data.windowWidth;
        player.windowHeight = data.windowHeight;
    })

    // socket.on("requestData", (data) => {
    //     player.progressXp += data.progressXpChange;
    //     // plants[data.plantIndex].hasFlower = data.hasFlower;
    // })

    socket.on("commandData", (data) => {
    	player.xp += data.xpChange;
    	player.progressXp += player.progressXp;
    	player.speed += data.speedChange;
    })

    socket.on("usedAbility", (data) =>{
    	player.whatAbility = data.whatAbility;
		switch(player.whatAbility){
		case "BoxRoll":
			player.abilityTimer = 80;
			player.abilityRollAngle = (3.14159/1)/player.abilityTimer;
			player.shellType = "Box";
			break;
		case "DomeRoll":
			player.abilityTimer = 80;
			player.abilityRollAngle = (3.14159*2)/player.abilityTimer;
			player.shellType = "Dome";
			break;
		case "SpikeRoll":
			player.abilityTimer = 10;
			player.abilityRollAngle = (3.14159/2)/player.abilityTimer;
			player.shellType = "Spike";
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
    })

    socket.on("choseCard", (data) =>{
    	player.abilityCardsActive = false;
    	player.abilitySet.push(data.abilityCard);
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
	this.abilityTimer;
	this.whatAbility;
	this.abilityRollAngle;
	this.abilitySet = [];
	this.bodyAngle = 0;

	this.abilityCards = [];
	this.abilityCardsActive = false;

	this.progressXp = 5;
	this.xp = this.progressXp;
	this.upgrade = 1; //player on first upgrade
	this.targetXp = 20;
	this.size = size;
	this.speed = 1.5;
	this.velY = 0;
	this.legOffsetX = 0;
	this.legOffsetY = 0;
	this.legDirX = 1;
	this.isFlipped;
	this.frontLegUp = 1;
	this.doMovement = true;
	this.headAngle = 0;
	this.distXToMouse = 0;

	this.shellType = "Box";

	this.windowWidth;
	this.windowHeight;

	this.getSpeed = function(){
		if(this.doingAbility){
			switch(this.whatAbility){
			case "BoxRoll":
				return (this.abilityRollAngle)*this.size
			case "DomeRoll":
				return (this.abilityRollAngle)*this.size
			case "SpikeRoll":
				return (this.abilityRollAngle)*this.size
			case "Hide":
				return 0;
			default:
				return 0;
			}
		} else{
			return this.speed
		}
	}

	this.doUpgrade = function(upgrade){
		if(this.abilityCardsActive === true){
			this.abilitySet.push(this.abilityCards[0]);
		}
		switch(upgrade){
		case 1:
			this.doingAbility = false;
			this.abilityCardsActive = true;
			this.abilityCards = ["Hide"];
			this.progressXp = this.progressXp-this.targetXp;
			this.size+=20;
			this.upgrade = 2;
			this.targetXp += 10;
			break;
		case 2:
			this.doingAbility = false;
			this.abilityCardsActive = true;
			this.abilityCards = ["BoxRoll", "Stomp"];
			this.progressXp = this.progressXp-this.targetXp;
			this.size+=30;
			this.upgrade = 3;
			this.targetXp += 20;
			break;
		case 3:
			this.doingAbility = false;
			this.abilityCardsActive = true;
			this.abilityCards = ["DomeRoll", "SpikeRoll"];
			this.progressXp = this.progressXp-this.targetXp;
			this.size+=30;
			this.upgrade = 4;
			this.targetXp += 20;
			break;
		case 4:
			this.progressXp = this.progressXp-this.targetXp;
			this.upgrade = 2;
        	this.size+=60;
    		this.upgrade = 2;
    		this.targetXp += 50;
    		break;
    	default:
    		break;
		}
	}

	this.playAbility = function(whatAbility){
		switch(whatAbility){
		case "BoxRoll":
			this.doMovement = false;
			this.bodyAngle+= this.abilityRollAngle; //the rotation completed stays the same
			if (!(this.isFlipped)) {
				if(this.x < mapSize){
					this.x += this.abilityRollAngle*this.size;
				}
			} else{
				if(this.x > 0){
					this.x -= this.abilityRollAngle*this.size;
				}
			}
			break;
		case "DomeRoll":
			this.doMovement = false;
			this.bodyAngle+= this.abilityRollAngle;
			if (!(this.isFlipped)) {
				if(this.x < mapSize){
					this.x += (this.abilityRollAngle)*this.size;
				}
			} else{
				if(this.x > 0){
					this.x -= (this.abilityRollAngle)*this.size;
				}
			}
			break;
		case "SpikeRoll":
			this.doMovement = false;
			this.bodyAngle+= this.abilityRollAngle;
			if (!(this.isFlipped)) {
				if(this.x < mapSize){
					this.x += (this.abilityRollAngle)*this.size;
				}
			} else{
				if(this.x > 0){
					this.x -= (this.abilityRollAngle)*this.size;
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

    	if(!(this.doingAbility && (this.whatAbility === "BoxRoll"||this.whatAbility === "DomeRoll"||this.whatAbility === "SpikeRoll"))){
	    	for(let i in plants){
				if(Math.sqrt(Math.pow(headX-plants[i].flower.x,2)+Math.pow(headY-plants[i].flower.y,2))< (range+plants[i].flower.size/2)){
					if(plants[i].hasFlower){
						plants[i].hasFlower = false;
						this.progressXp+= plants[i].flower.progressXp;
						this.xp+= plants[i].flower.progressXp;
						sendPlantUpdate();
					} 
				}
				for(let j in plants[i].leaves){
					if(Math.sqrt(Math.pow(headX-plants[i].leaves[j].x,2)+Math.pow(headY-plants[i].leaves[j].y,2))< (range+plants[i].leaves[j].size/2)){
						if(plants[i].hasLeaf[j]){
							plants[i].hasLeaf[j] = false;
							this.progressXp+= plants[i].leaves[j].progressXp;
							this.xp+= plants[i].leaves[j].progressXp;
							sendPlantUpdate();
						} 
					}
				}
	    	}
	    }
		
		if(this.progressXp>this.targetXp){
			this.doUpgrade(this.upgrade);
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
		for(t in players){
			if(players[t].id != this.id){
				var hitLeftSide = players[t].x+players[t].size/2>this.x-this.size/2 && players[t].x-players[t].size/2<this.x-this.size/2
				var hitRightSide = this.x+this.size/2>players[t].x-players[t].size/2 && this.x+this.size/2<players[t].x+players[t].size/2 
				var wayBiggerThanYou = (players[t].size/this.size)>5
				var waySmallerThanYou = (this.size/players[t].size)>5
				var yourSpeed = this.getSpeed()
				var othersSpeed = players[t].getSpeed()
				if((hitLeftSide || hitRightSide) && !(wayBiggerThanYou || waySmallerThanYou)){
					if(hitLeftSide){
						if(this.size>players[t].size){
							players[t].doMovement = false;
							players[t].x -= yourSpeed;
						} else{
							this.doMovement = false;
							this.x += othersSpeed;
						}
					} else if(hitRightSide){
						if(this.size>players[t].size){
							players[t].doMovement = false;
							players[t].x+=yourSpeed;
						} else{
							this.doMovement = false;
							this.x-=othersSpeed;
						}
					}

				}
			}
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
            progressXp: this.progressXp,
            xp: this.xp,
            upgrade: this.upgrade,
            targetXp: this.targetXp,
            size: this.size,
            doMovement: this.doMovement,
            legOffsetX: this.legOffsetX,
            frontLegUp: this.frontLegUp,
            isFlipped: this.isFlipped,
            shellType: this.shellType,
            headAngle: this.headAngle,
            bodyAngle : this.bodyAngle,
            doingAbility: this.doingAbility,
            whatAbility: this.whatAbility,
            abilitySet: this.abilitySet,
            abilityCardsActive: this.abilityCardsActive,
            abilityCards: this.abilityCards,
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
	this.progressXp = 10+Math.random()*5;
	this.size = 150;
	return this;
}

var Leaf = function(x, y, isFlipped){
	this.x = x;
	this.y = y;
	this.isFlipped = isFlipped;
	this.progressXp = 3+Math.random()*2;
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
