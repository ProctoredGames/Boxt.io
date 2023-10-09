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

server.listen(port, function(){//when the server starts, generate the map with this function
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
  
    // socket.on("commandData", (data) => {
    // 	player.xp += data.xpChange;
    // 	player.progressXp += player.progressXp;
    // 	player.speed += data.speedChange;
    // })

    socket.on("usedAbility", (data) =>{
    	player.whatAbility = data.whatAbility;
			switch(player.whatAbility){
			case "BoxRoll":
				player.abilityTimer = BoxRollTime;
				player.shellType = "Box";
				break;
			case "DomeRoll":
				player.abilityTimer = DomeRollTime;
				player.shellType = "Dome";
				break;
			case "SpikeRoll":
				player.abilityTimer = SpikeRollTime;
				player.shellType = "Spike";
				break;
			case "Hide":
				player.abilityTimer = HideTime;
				break;
	    case "Stomp":
				player.abilityTimer = StompTime;
				break;
			case "JumpStomp":
				player.abilityTimer = JumpStompTime;
				break;
			case "Shockwave":
				player.abilityTimer = StompTime;
				break;
      case "Dash":
				player.abilityTimer = DashTime;
				break;
      case "Charge":
				player.abilityTimer = ChargeTime;
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
    	if(player.upgrade!=4){
    		player.abilitySet.push(data.abilityCard);
    	} else{
    		player.abilitySet[player.abilitySet.length-1] = data.abilityCard;
        switch(data.abilityCard){
        case "BoxRoll":
          player.shellType = "Box";
          break;
        case "DomeRoll":
          player.shellType = "Box";
          break;
        case "SpikeRoll":
          player.shellType = "Box";
          break;
        default:
          break;
        } 
    	}
    })

    socket.on("disconnect", () => {
        io.emit('someoneLeft', {id: socket.id});

        players = players.filter((element) => element.id !== socket.id);
        if(players.length === 0){
          plants = [];
          var plant = {};
          for(let i = 0; i< (mapSize/100); i++){
            plant = new Plant(i, Math.random()*mapSize, (Math.random()*300)+200, true, true);
            plants.push(plant);
          }
        }
    });

})

//leg has a total range of 20% of the turtle
var upperLegBound = 0.025;
var lowerLegBound = -0.075;

var detectionRange = 0.4; //mouse moves player when it is greater than 60% of the player size
var mapSize = 12000;

var BoxRollTime = 40;
var DomeRollTime = 40;
var SpikeRollTime = 10;
var HideTime = 120;
var StompTime = 5;
var JumpStompTime = 1;
var ShockwaveTime = 1;
var DashTime = 60;
var ChargeTime = 30;

var BoxRollAngle = (3.14159*1)/BoxRollTime;
var DomeRollAngle = (3.14159*2)/DomeRollTime;
var SpikeRollAngle = (3.14159/2)/SpikeRollTime;

var names = ["bob", "boxt.io", "Noob", ".", "KingOfBoxt"];

var Player = function(id, name, x, y, size){
	this.id = id;
	this.name = names[Math.floor(Math.random()*(names.length-1))];
	this.x = x;
	this.y = y;
  
  this.bumpForce = 0;

	this.doingAbility = false;
	this.abilityTimer;
	this.whatAbility;
	this.abilitySet = [];
	this.bodyAngle = 0;

	this.abilityCards = [];
	this.abilityCardsActive = false;

	this.progressXp = 5;
	this.xp = this.progressXp;
	this.upgrade = 1; //player on first upgrade
	this.targetXp = 20;
	this.size = size;
	this.walkSpeed = 1.5;
	this.velY = 0;
	this.legOffsetX = 0;
	this.legOffsetY = 0;
	this.legDirX = 1;
	this.isFlipped;
	this.frontLegUp = 1;
	this.doMovement = true;
	this.headAngle = 0;
	this.distXToMouse = 0;
  this
	this.shellType = "Box";

	this.windowWidth;
	this.windowHeight;

	this.getSpeed = function(){
		if(this.doingAbility){
			switch(this.whatAbility){
			case "BoxRoll":
				return (BoxRollAngle)*this.size;
        break;
			case "DomeRoll":
				return (DomeRollAngle)*this.size;
        break;
			case "SpikeRoll":
				return (SpikeRollAngle)*this.size;
        break;
      case "Stomp":
				return this.walkSpeed/2;
        break;
      case "Dash":
        return this.walkSpeed*5;
      case "Charge":
        return this.walkSpeed*10;
      case "Hide":
        return 0;
        break;
			default: //if not specified, assume regular movement
				return this.walkSpeed;
        break;
			}
		} else{
			return this.walkSpeed
		}
	}

	this.doUpgrade = function(upgrade){
		if(!(this.abilityCardsActive === true)){
			switch(upgrade){
			case 1:
				this.abilityCardsActive = true;
				this.abilityCards = ["Hide"];
				this.progressXp = this.progressXp-this.targetXp;
				this.upgrade = 2;
				this.targetXp += 10;
        this.size += 20;
				break;
			case 2:
				this.abilityCardsActive = true;
				this.abilityCards = ["BoxRoll", "Stomp", "Dash"];
				this.progressXp = this.progressXp-this.targetXp;
				this.upgrade = 3;
				this.targetXp += 20;
        this.size += 20;
				break;
			case 3:
				this.abilityCardsActive = true;
				switch(this.abilitySet[this.abilitySet.length-1]){
				case "BoxRoll":
					this.abilityCards = ["DomeRoll", "SpikeRoll"];
					break;
				case "Stomp":
					this.abilityCards = ["JumpStomp", "Shockwave"];
					break;
        case "Dash":
          this.abilityCards = ["Charge"];
					break;
				default:
					console.log("ability cannot be upgraded");
					this.abilityCards = ["ERROR"];
					break;
				}
				this.progressXp = this.progressXp-this.targetXp;
				this.upgrade = 4;
				this.targetXp += 20;
        this.size += 20;
				break;
			case 4:
				this.progressXp = this.progressXp-this.targetXp;
	    	this.upgrade = 2;
	    	this.targetXp += 50;
        this.size += 50;
	    	break;
	    default:
	    	break;
			}
		}
	}
  
  this.handleCollisions = function(){
    for(let t in players){
			if(players[t].id != this.id){
				var hitLeftSide = players[t].x+players[t].size/2>this.x-this.size/2 && players[t].x-players[t].size/2<this.x-this.size/2
				var hitRightSide = this.x+this.size/2>players[t].x-players[t].size/2 && this.x+this.size/2<players[t].x+players[t].size/2 
				var wayBiggerThanYou = (players[t].size/this.size)>5
				var waySmallerThanYou = (this.size/players[t].size)>5
				var yourSpeed = this.getSpeed(); //if player is still (not ability) getspeed() is NOT ZERO!!!
				var othersSpeed = players[t].getSpeed();
				if((hitLeftSide || hitRightSide) && !(wayBiggerThanYou || waySmallerThanYou)){
					if(hitLeftSide){
						if(this.size>players[t].size){
              if(players[t].x > 0){
                if(yourSpeed != 0){
                  players[t].x -= yourSpeed;
                }
              }
						} else{
              if(this.x < mapSize){
							  this.x += othersSpeed;
              }	
						}
					}
          if(hitRightSide){
						if(this.size>players[t].size){
              if(players[t].x<mapSize){
							  players[t].x += yourSpeed;
              }
						} else{
              if(this.x > 0){
							  this.x -= othersSpeed;
              }
						}
					}
				}
			}
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
    range = this.size*0.075;

    if(!(this.doingAbility && (this.whatAbility === "BoxRoll"||this.whatAbility === "DomeRoll"||this.whatAbility === "SpikeRoll"))){
      for(let i in plants){
        if(Math.sqrt(Math.pow(headX-plants[i].flower.x,2)+Math.pow(headY-plants[i].flower.y,2))< (range+plants[i].flower.size/2)){
          if(plants[i].hasFlower){
            plants[i].hasFlower = false;
            this.progressXp+= plants[i].flower.xp;
            this.xp+= plants[i].flower.xp;
            sendPlantUpdate();
          } 
        }
        for(let j in plants[i].leaves){
          if(Math.sqrt(Math.pow(headX-plants[i].leaves[j].x,2)+Math.pow(headY-plants[i].leaves[j].y,2))< (range+plants[i].leaves[j].size/2)){
            if(plants[i].hasLeaf[j]){
              plants[i].hasLeaf[j] = false;
              this.progressXp+= plants[i].leaves[j].xp;
              this.xp+= plants[i].leaves[j].xp;
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

	this.playAbility = function(whatAbility){
    if(this.abilityTimer>0){
      switch(whatAbility){
      case "BoxRoll":
        this.bodyAngle += BoxRollAngle;
        break;
      case "DomeRoll":
        this.bodyAngle += DomeRollAngle;
        break;
      case "SpikeRoll":
        this.bodyAngle += SpikeRollAngle;
        break;
      case "Stomp":
      	if(this.abilityTimer === StompTime){
          this.legOffsetX = (upperLegBound*this.size)-(StompTime*this.getSpeed());
          this.frontLegUp = true;
          this.legDirX = 1;
        } else if(this.abilityTimer === 1){
          this.frontLegUp = false;
          this.legDirX = -1;
          for(let t in players){
            if(players[t].id != this.id){
              if(Math.abs(players[t].x-this.x)<((this.size/2+players[t].size/2)+(this.size*0.75))){
                if(players[t].x>this.x){
                  players[t].bumpForce = this.size/10;
                }
                if(players[t].x<this.x){
                  players[t].bumpForce = -(this.size/10);
                }
              }
            }
          }
        }
        break;
      case "JumpStomp":
      	for(let p in plants){ //testing
          for(let l in plants[p].hasLeaf){
            plants[p].hasLeaf[l] = true;
          }
          plants[p].hasFlower = true;
        }
        break;
      case "Shockwave":
      	for(let t in players){
      		if(Math.abs(players[t].x-this.x)<400){
      			players[t].x += players[t].x-this.x;
      		}
      	}
      	break;
      case "Dash":
      	//do nothing, only increases speed
        break;
      case "Charge":
      	//do nothing, only increases speed
        break;
      case "Hide":
        //do nothing
        break;
      default:
        break;
      }
      this.abilityTimer -= 1;
    }
		if(this.abilityTimer === 0){
			this.doingAbility = false;
		}
	}

	this.animateLegs = function(){
		this.legOffsetX+=this.getSpeed()*this.legDirX;
		if(this.walkSpeed*this.doMovement === 0){
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

	this.update = function(){
    if(this.bumpForce != 0){ //abilities can do this
      this.bumpForce *= 0.9;
      if(Math.abs(this.bumpForce)<0.1){
        this.bumpForce = 0;
      }
      this.x+=this.bumpForce;
    }
		if(this.distXToMouse<this.size*detectionRange){
			this.doMovement = false;
		} else{
			this.doMovement = true;
		}
    this.handleXp();
		if(this.doingAbility){
			this.playAbility(this.whatAbility); //this can overwrite anything
		}
    this.animateLegs();
    this.handleCollisions();
    
		if(this.doMovement){
			if (!(this.isFlipped)) {
				if(this.x < mapSize){
					this.x += this.getSpeed();
				}
			} else{
				if(this.x > 0){
					this.x -= this.getSpeed();
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
      // leaves: this.leaves,
		}
	}
	return this;
}

var Flower = function(x,y){
	this.x = x;
	this.y = y;
	this.xp = 25+Math.random()*5;
	this.size = 150;
	return this;
}

var Leaf = function(x, y, isFlipped){
	this.x = x;
	this.y = y;
	this.isFlipped = isFlipped;
	this.xp = 3+Math.random()*2;
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

setInterval(() => {
    var updatePack = [];

    for(let i in players) {
        players[i].update();
        updatePack.push(players[i].getUpdatePack());
    }
  
    io.emit("updatePack", {updatePack});

    // if(1){
    //   var plantIndex = Math.floor(Math.random())*(plants.length-1);
    //   var leafIndex = Math.floor(Math.random())*(plants[plantIndex].hasLeaf.length-1);
    //   plants[plantIndex].hasLeaf[leafIndex] = true;
    //   plants[plantIndex].leaves[leafIndex].size = 500;
    //   sendPlantUpdate();
    // }
}, 1000/35)
