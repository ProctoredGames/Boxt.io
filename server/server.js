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

//needs to be changed in BOTH server and client
var mapSize = 6000;

var XPtargets = [5, 20, 30, 40, 70]; //requred to pass 0, 1, 2, 3, 4

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
        player = new Player(socket.id, data.name,  Math.random() * mapSize,0);
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
    //     player.progressXP += data.progressXPChange;
    //     // plants[data.plantIndex].hasFlower = data.hasFlower;
    // })
  
    // socket.on("commandData", (data) => {
    // 	player.XP += data.XPChange;
    // 	player.progressXP += player.progressXP;
    // 	player.speed += data.speedChange;
    // })

    socket.on("usedAbility", (data) =>{
    	player.whatAbility = player.abilitySet[data.whatAbility];
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
				player.abilityTimer =ShockwaveTime;
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
    	if(player.upgrade!=3){
    		player.abilitySet.push(player.abilityCards[data.abilityCard]);
    	} else{ //upgrade existing ability instead
    		player.abilitySet[player.abilitySet.length-1] = player.abilityCards[data.abilityCard];
    	}
      player.abilityCards = []; //stops hacking by making indices worthless after used
      
      if(player.upgrade != 4){
        player.progressXP = player.progressXP-player.targetXP;
        player.targetXP += XPtargets[player.upgrade];
        player.HP *= ((player.XP/2)/player.maxHP)
        player.maxHP = player.XP/2;
        switch(player.upgrade){
        case 1:
          player.upgrade = 2;
          break;
        case 2:
          player.upgrade = 3;
          break;
        case 3:
          player.upgrade = 4;
          break;
        case 4:
          player.upgrade = 2;
          break;
        default:
          break;
        }
      }
      
      player.doingAbility = true;
      player.whatAbility = "Dash";
      player.abilityTimer = 15;
      
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

var BoxRollTime = 40;
var DomeRollTime = 40;
var SpikeRollTime = 10;
var HideTime = 120;
var StompTime = 5;
var JumpStompTime = 1; //testing
var ShockwaveTime = 10;
var DashTime = 60;
var ChargeTime = 30;

var BoxRollAngle = (3.14159*1)/BoxRollTime;
var DomeRollAngle = (3.14159*2)/DomeRollTime;
var SpikeRollAngle = (3.14159/2)/SpikeRollTime;

var names = ["CarlSim", "Bob", "boxt.io", "Noob", ".", "Carl", "KingOfBoxt", "ERROR"];

var Player = function(id, name, x, y){
	this.id = id;
	this.name = names[Math.floor(Math.random()*(names.length))];
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

	this.progressXP = XPtargets[0];
	this.XP = this.progressXP;
  
  this.maxHP = this.XP;
  this.HP = this.maxHP;
  
	this.upgrade = 1; //player on first upgrade
	this.targetXP = XPtargets[this.upgrade];
	this.size = 120;
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
      case "Shockwave":
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
		if(!(this.abilityCardsActive)){
			switch(upgrade){
			case 1:
				this.abilityCardsActive = true;
				this.abilityCards = ["Hide"];
				break;
			case 2:
				this.abilityCardsActive = true;
				this.abilityCards = ["BoxRoll", "Stomp", "Dash"];
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
        break;
			case 4:
        //no cards to show
        this.progressXP = this.progressXP-this.targetXP;
        this.targetXP += XPtargets[this.upgrade];
        this.size += XPtargets[this.upgrade]
        this.HP *= ((this.XP/2)/this.maxHP)
        this.maxHP = this.XP/2;
        this.upgrade = 2;
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

        //PLAYERS[t] hit left or PLAYERS[t] hit right
				if((hitLeftSide || hitRightSide) && !(wayBiggerThanYou || waySmallerThanYou)){
          if(hitLeftSide){
            if(this.size>players[t].size){
              if(players[t].x > 0){
                if(this.getSpeed() != 0){
                  players[t].x -= this.getSpeed();
                }
              }
            } else{
              if(this.x < mapSize){
                this.x += (players[t].getSpeed()+this.getSpeed());
              }	
            }
            this.bumpForce = 5
            players[t].bumpForce = -5
          }else if(hitRightSide){
            if(this.size>players[t].size){
              if(players[t].x<mapSize){
                players[t].x += this.getSpeed();
              }
            } else{
              if(this.x > 0){
                this.x -= (players[t].getSpeed()+this.getSpeed());
              }
            }
            this.bumpForce = -5
            players[t].bumpForce = 5
          }
          if(!((this.doingAbility && this.whatAbility == "Hide") || (players[t].doingAbility && players[t].whatAbility == "Hide"))){
            //we need to check everything for both players as the one first in the array will check first
            if((this.isFlipped && players[t].isFlipped && hitLeftSide) || (this.isFlipped && !players[t].isFlipped && hitLeftSide) ||
              (!this.isFlipped && players[t].isFlipped && hitRightSide) || (!this.isFlipped && !players[t].isFlipped && hitRightSide)){
              players[t].HP-= this.XP/5;
              if(players[t].HP<=0){
                this.XP += players[t].XP;
                this.progressXP += players[t].XP;
                this.size += (players[t].XP-XPtargets[0])/3;
              }
            }
            if((!players[t].isFlipped && !this.isFlipped && hitLeftSide) || (!players[t].isFlipped && this.isFlipped && hitLeftSide) ||
              (players[t].isFlipped && !this.isFlipped && hitRightSide) || (players[t].isFlipped && this.isFlipped && hitRightSide)){
              this.HP-= players[t].XP/5;
              if(this.HP<=0){
                players[t].XP += this.XP;
                players[t].progressXP += this.XP;
                players[t].size += (this.XP-XPtargets[0])/3;
              }
            }
          }
				}
			}
		}
  }
  
	this.handleXP = function(){
		var headX;
		var headY;
		var range;
		if(!this.isFlipped){
			headX = this.x+this.size*0.65;
		} else{
			headX = this.x-this.size*0.65;
		}
    headY = this.y-this.size*0.44;
    range = this.size*0.075;

    if(!(this.doingAbility && (this.whatAbility === "BoxRoll"||this.whatAbility === "DomeRoll"||this.whatAbility === "SpikeRoll"))){
      for(let i in plants){
        if(Math.sqrt(Math.pow(headX-plants[i].flower.x,2)+Math.pow(headY-plants[i].flower.y,2))< (range+plants[i].flower.size/2)){
          if(plants[i].hasFlower){
            plants[i].hasFlower = false;
            this.progressXP+= plants[i].flower.XP;
            this.XP+= plants[i].flower.XP;
            this.size+= (plants[i].flower.XP)/3;
            sendPlantUpdate();
          } 
        }
        for(let j in plants[i].leaves){
          if(Math.sqrt(Math.pow(headX-plants[i].leaves[j].x,2)+Math.pow(headY-plants[i].leaves[j].y,2))< (range+plants[i].leaves[j].size/2)){
            if(plants[i].hasLeaf[j]){
              plants[i].hasLeaf[j] = false;
              this.progressXP+= plants[i].leaves[j].XP;
              this.XP+= plants[i].leaves[j].XP;
              this.size+= (plants[i].leaves[j].XP)/3;
              sendPlantUpdate();
            } 
          }
        }
      }
	  }
		
		if(this.progressXP>this.targetXP){
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
      	// for(let p in plants){ //testing
      	// for(let l in plants[p].hasLeaf){
      	// plants[p].hasLeaf[l] = true;
      	// }
      	// plants[p].hasFlower = true;
      	// }
        break;
      case "Shockwave":
      	if(this.abilityTimer === ShockwaveTime){
          this.legOffsetX = (upperLegBound*this.size)-(ShockwaveTime*this.getSpeed());
          this.frontLegUp = true;
          this.legDirX = 1;
        } else if(this.abilityTimer === 1){
          this.frontLegUp = false;
          this.legDirX = -1;
          for(let t in players){
            if(players[t].id != this.id){
              if(Math.abs(players[t].x-this.x)<((this.size/2+players[t].size/2)+(this.size*1.25))){
                if(players[t].x>this.x){
                  players[t].bumpForce = this.size/8;
                }
                if(players[t].x<this.x){
                  players[t].bumpForce = -(this.size/8);
                }
              }
            }
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
  
  this.die = function(){
    this.x = Math.random()*mapSize;
    this.progressXP = XPtargets[0];
    this.XP = this.progressXP;
    this.upgrade = 1; //player on first upgrade
    this.targetXP = 20;
    this.size = 120;
    this.walkSpeed = 1.5;
    this.bumpForce = 0;
    this.abilityCardsActive = false;
    this.abilityCards = [];
    this.abilitySet = [];
    this.maxHP = XPtargets[0];
    this.HP = this.maxHP;
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
    if(this.bumpForce != 0){ //main game physics
      this.bumpForce *= 0.9;
      if(Math.abs(this.bumpForce)<0.1){
        this.bumpForce = 0;
      }
      if(this.x<mapSize && this.x>0){
        this.x+=this.bumpForce;
      }
    }
		if(this.distXToMouse<this.size*detectionRange){
			this.doMovement = false;
		} else{
			this.doMovement = true;
		}
    this.handleXP();
		if(this.doingAbility){
			this.playAbility(this.whatAbility); //this can overwrite anything
		}
    this.animateLegs();
    this.handleCollisions();
    
    if(this.HP <= 0){
      this.die();
    }
    
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
            progressXP: this.progressXP,
            XP: this.XP,
            HP: this.HP,
            maxHP: this.maxHP,
            upgrade: this.upgrade,
            targetXP: this.targetXP,
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
	this.XP = 25+Math.random()*5;
	this.size = 150;
	return this;
}

var Leaf = function(x, y, isFlipped){
	this.x = x;
	this.y = y;
	this.isFlipped = isFlipped;
	this.XP = 3+Math.random()*2;
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
  
}, 35)

setInterval(() => {
  for(let i in plants) {
    if(Math.floor(Math.random()*5)===0){
      for(let j in plants[i].hasLeaf){
        if(plants[i].hasLeaf[j] === false){
          if(Math.floor(Math.random()*3)===0){
            plants[i].hasLeaf[j] = true;
          }
        }
      }
      if(plants[i].hasFlower === false){
        if(Math.floor(Math.random()*5)===0){
          plants[i].hasFlower = true;
        }
      }
      sendPlantUpdate();
    }
  }
}, 5000)
