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
var bots = [];
var cracks = [];

var maxAbilityCards = 4; //probably will want to change this

//needs to be changed in BOTH server and client
var mapSize = 6000;

var XPtargets = [5, 20, 30, 40, 70]; //requred to pass 0, 1, 2, 3, 4

server.listen(port, function(){//when the server starts, generate the map with this function
	var plant = {};
	for(let i = 0; i< (mapSize/100); i++){
		plant = new Plant(i, Math.random()*mapSize, (Math.random()*250)+250, true, true);
		plants.push(plant);
	}
  var bot = {};
  for(let i = 0; i<4; i++){
    bot = new Bot(i, (Math.random()*mapSize), 0, (Math.random()*200));
    bots.push(bot);
  }
	console.log("Server Started on port "+ port +"!");
});

io.on('connection', function(socket) {
    console.log('someone connected, Id: ' + socket.id);
    var player = {};
    
    socket.on("loadedPage", (data) =>{
      socket.emit("initPack", {initPack: getAllPlayersInitPack()});
      socket.emit("plantInitPack", {plantInitPack: getAllPlantsInitPack()});
      socket.emit("botInitPack", {botInitPack: getAllBotsInitPack()});
      socket.emit("crackInitPack", {crackInitPack: getAllCracksInitPack()});
    })

    socket.on("imReady", (data) => { //player joins
        var playerDeveloper
        if(data.name === "?PROCTOR++!"){ //its a secret shhh
			    playerDeveloper = true
			    data.name = "Proctor - DEV"
        }else if(data.name === "?TUMASAKIII!"){
          playerDeveloper = true
          data.name = "Tumasakiii - MOD"
        }else if(data.name === "?HOURMC++!"){
			    playerDeveloper = true
			    data.name = "HourMC - DEV"
        } else{
			    playerDeveloper = false
        }
        player = new Player(socket.id, data.name, (Math.random()*mapSize),0, 5, playerDeveloper);
      
        players.push(player);

        socket.emit("yourId", {id: player.id});
        socket.broadcast.emit('newPlayer', player.getInitPack()); //sends new guy's data to everyone
        socket.emit("initPack", {initPack: getAllPlayersInitPack()}); //sends everyone's data to new player
        socket.emit("plantInitPack", {plantInitPack: getAllPlantsInitPack()});
        socket.emit("botInitPack", {botInitPack: getAllBotsInitPack()});
        socket.emit("crackInitPack", {crackInitPack: getAllCracksInitPack()});
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
  
    socket.on("chatMessage", (data) => {
      var thisMessagePack = {}
      thisMessagePack.message = data.chatMessage
      thisMessagePack.id = player.id
	  if(player.isDeveloper){
		  switch(data.chatMessage){
			  case "/resetall":
			  for(let i in players){
				  players[i].reset()
			  }
			  break
        case "/reset":
				player.reset()
			  break
			  case "/sizeall 3":
			  for(let i in players){
				  players[i].XP = Math.random()*300+3000
          players[i].progressXP = Math.random()*300+3000
			  }
			  break
			  case "/sizeall 2":
			  for(let i in players){
				  players[i].XP = Math.random()*300+1500
          players[i].progressXP = Math.random()*300+1500
			  }
			  break
			  case "/sizeall 1":
			  for(let i in players){
				  players[i].XP = Math.random()*300+0
          players[i].progressXP = Math.random()*300+0
			  }
			  break
			  case "/size 3":
			  player.XP = Math.random()*300+3000
        player.progressXP = Math.random()*300+3000
			  break
			  case "/size 2":
			  player.XP = Math.random()*300+1500
        player.progressXP = Math.random()*300+1500
			  break
			  case "/size 1":
			  player.XP = Math.random()*300+0
        player.progressXP = Math.random()*300+0
			  break
        
        case "/speedall 3":
			  for(let i in players){
				  players[i].walkSpeed = 6
			  }
			  break
			  case "/speedall 2":
			  for(let i in players){
				   players[i].walkSpeed = 3
			  }
			  break
			  case "/speedall 1":
			  for(let i in players){
				   players[i].walkSpeed = 1.5
			  }
			  break
			  case "/speed 3":
			  player.walkSpeed = 6
			  break
			  case "/speed 2":
			  player.walkSpeed = 3
			  break
			  case "/speed 1":
			  player.walkSpeed = 1.5
			  break
        
			  default:
			  break
		  }
	  }
      socket.broadcast.emit("getChat", {messagePack: thisMessagePack}); //send to everyone else
      socket.emit("getChat", {messagePack: thisMessagePack}); //send back to sender
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
      if(player.cooldownSet[data.whatAbility] === 0 && !(player.doingAbility && player.whatAbility === "JumpStomp")){ //you cannot interupt JumpStomp
        switch(player.abilitySet[data.whatAbility]){
        case "BoxRoll":
          player.abilityTimer = BoxRollTime;
          player.cooldownLength[data.whatAbility] = BoxRollCooldown;
          player.cooldownSet[data.whatAbility] = BoxRollCooldown;
          player.shellType = "Box";
          break;
        case "DomeRoll":
          player.abilityTimer = DomeRollTime;
          player.cooldownLength[data.whatAbility] = DomeRollCooldown;
          player.cooldownSet[data.whatAbility] = DomeRollCooldown;
          player.shellType = "Dome";
          break;
        case "SpikeRoll":
          player.abilityTimer = SpikeRollTime;
          player.cooldownLength[data.whatAbility] = SpikeRollCooldown;
          player.cooldownSet[data.whatAbility] = SpikeRollCooldown;
          player.shellType = "Spike";
          break;
        case "Hide":
          player.abilityTimer = HideTime;
          player.cooldownLength[data.whatAbility] = HideCooldown;
          player.cooldownSet[data.whatAbility] = HideCooldown;
          break;
        case "Stomp":
          player.abilityTimer = StompTime;
          player.cooldownLength[data.whatAbility] = StompCooldown;
          player.cooldownSet[data.whatAbility] = StompCooldown;
          break;
        case "JumpStomp":
          player.abilityTimer = JumpStompTime;
          player.cooldownLength[data.whatAbility] = JumpStompCooldown;
          player.cooldownSet[data.whatAbility] = JumpStompCooldown;
          break;
        case "Shockwave":
          player.abilityTimer = ShockwaveTime;
          player.cooldownLength[data.whatAbility] = ShockwaveCooldown;
          player.cooldownSet[data.whatAbility] = ShockwaveCooldown;
          break;
        case "Dash":
          player.abilityTimer = DashTime;
          player.cooldownLength[data.whatAbility] = DashCooldown;
          player.cooldownSet[data.whatAbility] = DashCooldown;
          break;
        case "Charge":
          player.abilityTimer = ChargeTime;
          player.cooldownLength[data.whatAbility] = ChargeCooldown;
          player.cooldownSet[data.whatAbility] = ChargeCooldown;
          break;
        default:
          console.log("Ability doesnt exist");
          player.abilityTimer = 0;
          break;
        }
        player.whatAbility = player.abilitySet[data.whatAbility];
        player.doingAbility = true;
        player.bodyAngle = 0;
      }
      if(player.isDeveloper){
        player.cooldownSet[data.whatAbility] = 0
      }
        
    })

    socket.on("choseCard", (data) =>{
      player.abilityCardsActive = false;
    	if(player.upgrade!=3){
        if(player.upgrade!=4){
          player.abilitySet.push(player.abilityCards[data.abilityCard]);
          player.cooldownLength.push(0);
          player.cooldownSet.push(0);
        }
    	} else{ //upgrade existing ability instead
    		player.abilitySet[player.abilitySet.length-1] = player.abilityCards[data.abilityCard];
        player.cooldownLength[player.abilitySet.length-1] = 0;
        player.cooldownSet[player.abilitySet.length-1] = 0;
    	}
      player.abilityCards = []; //stops hacking by making indices worthless after used
      
      player.progressXP = player.progressXP-player.targetXP;
      player.targetXP += XPtargets[player.upgrade];
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
      case 4: //Grow Turtle!
        player.XP += 100
        player.size = player.getSize();
        player.upgrade = 2;
        break;
      default:
        break;
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

var detectionRange = 0.25

var BoxRollTime = 40;
var DomeRollTime = 40;
var SpikeRollTime = 10;
var HideTime = 120;
var StompTime = 5;
var JumpStompTime = 100000; //max ticks turtle can be in air for
var ShockwaveTime = 40;
var DashTime = 30;
var ChargeTime = 20;

var BoxRollCooldown = 250;
var DomeRollCooldown = 500;
var SpikeRollCooldown = 280;
var HideCooldown = 400;
var StompCooldown = 200;
var JumpStompCooldown = 300;
var ShockwaveCooldown = 250;
var DashCooldown = 250;
var ChargeCooldown = 300;

var BoxRollAngle = (3.14159*1)/BoxRollTime;
var DomeRollAngle = (3.14159*2)/DomeRollTime;
var SpikeRollAngle = (3.14159/2)/SpikeRollTime;

var names = ["CarlSim", "Bob", "boxt.io", "Noob", ".", "Carl", "KingOfBoxt", "ERROR"];

var Player = function(id, name, x, y, XP, isDeveloper){
  
  this.getSize = function(){
    var modifier = 3000;
    var startingSize = 120;
    var maxSize = 1000;
    return (((this.XP*(maxSize-startingSize))/(this.XP+modifier))+startingSize);
  }
  
	this.id = id;
	this.name = name;
  this.isDeveloper = isDeveloper;
	this.x = x;
	this.y = y;
  
  this.bumpForce = 0;

	this.doingAbility = false;
	this.abilityTimer;
	this.whatAbility;
	this.abilitySet = [];
  this.cooldownLength = []; //total cooldown
  this.cooldownSet = []; //cooldown left
	this.bodyAngle = 0;

	this.abilityCards = [];
	this.abilityCardsActive = false;

  this.XP = XP;
	this.progressXP = this.XP;
  this.size = this.getSize();

  this.jumpForce = 50;
  this.jumpDelta = this.jumpForce;
  this.gravity = 5;
  
  this.maxHP = this.size;
  this.HP = this.maxHP;
  
	this.upgrade = 1; //player on first upgrade
	this.targetXP = XPtargets[this.upgrade];
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
      case "JumpStomp":
				return this.walkSpeed*20;
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
        this.abilityCardsActive = true;
				this.abilityCards = ["Grow Turtle!"];
        break;
	    default:
	    	break;
			}
		}
	}
  
  this.handleCollisions = function(){
    for (let b in bots){
      var hitLeftSide = bots[b].x+bots[b].size/2>this.x-this.size/2 && bots[b].x-bots[b].size/2<this.x-this.size/2
      var hitRightSide = this.x+this.size/2>bots[b].x-bots[b].size/2 && this.x+this.size/2<bots[b].x+bots[b].size/2 
      var hitTopSide = bots[b].y-bots[b].size/4>this.y-this.size/4-this.size*0.75 && bots[b].y-bots[b].size/4-bots[b].size*0.75<this.y-this.size/4-this.size*0.75
      var hitBottomSide = this.y-this.size/4>bots[b].y-bots[b].size/4-bots[b].size*0.75 && this.y-this.size/4-this.size*0.75<bots[b].y-bots[b].size/4-bots[b].size*0.75
  
      if(hitBottomSide && (hitLeftSide || hitRightSide) && (this.doingAbility && this.whatAbility === "JumpStomp")){
        this.jumpDelta = this.jumpForce
      }
      if((hitLeftSide || hitRightSide) && (hitTopSide || hitBottomSide)){
        if(!(hitBottomSide && (hitLeftSide || hitRightSide) && (this.doingAbility && this.whatAbility === "JumpStomp"))){
          bots[b].HP-= this.size/5;
        }
        if(hitLeftSide){
          if(this.size>bots[b].size){
            if(bots[b].x > 0){
              bots[b].x -= this.getSpeed();
            }
          } else{
            if(this.x < mapSize){
              this.x += (bots[b].walkSpeed+this.getSpeed());
            }	
          }
          this.bumpForce = 5
          bots[b].bumpForce = -5
          bots[b].isFlipped = true
        }else if(hitRightSide){
          if(this.size>bots[b].size){
            if(bots[b].x<mapSize){
              bots[b].x += this.getSpeed();
            }
          } else{
            if(this.x > 0){
              this.x -= (bots[b].walkSpeed+this.getSpeed());
            }
          }
          this.bumpForce = -5
          bots[b].bumpForce = 5
          bots[b].isFlipped = false
        }
        
        if(bots[b].HP<=0){
          this.XP+=bots[b].XP*0.75;
          this.progressXP+=bots[b].XP*0.75;
          this.size = this.getSize();
          
          this.HP += (bots[b].maxHP); //for eating the ladybug
          
          bots[b].die();
        }
      }
    }
    for(let t in players){
			if(players[t].id != this.id){
				var hitLeftSide = players[t].x+players[t].size/2>this.x-this.size/2 && players[t].x-players[t].size/2<this.x-this.size/2
				var hitRightSide = this.x+this.size/2>players[t].x-players[t].size/2 && this.x+this.size/2<players[t].x+players[t].size/2 
				var hitTopSide = players[t].y-players[t].size/4>this.y-this.size/4-this.size*0.75 && players[t].y-players[t].size/4-players[t].size*0.75<this.y-this.size/4-this.size*0.75
        var hitBottomSide = this.y-this.size/4>players[t].y-players[t].size/4-players[t].size*0.75 && this.y-this.size/4-this.size*0.75<players[t].y-players[t].size/4-players[t].size*0.75
      
        if(hitBottomSide && (hitLeftSide || hitRightSide) && (this.doingAbility && this.whatAbility === "JumpStomp")){
          this.jumpDelta = this.jumpForce
        }
        if(hitTopSide && (hitLeftSide || hitRightSide) && (players[t].doingAbility && players[t].whatAbility === "JumpStomp")){
          players[t].jumpDelta = players[t].jumpForce
        }
        if((hitLeftSide || hitRightSide) && (hitTopSide || hitBottomSide)){
          if(hitLeftSide){
            if(this.size>players[t].size){
              if(players[t].x > 0){
                players[t].x -= this.getSpeed();
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
            if(!(hitBottomSide && (hitLeftSide || hitRightSide) && (this.doingAbility && this.whatAbility === "JumpStomp")) &&
              !(hitTopSide && (hitLeftSide || hitRightSide) && (players[t].doingAbility && players[t].whatAbility === "JumpStomp"))){
              if((this.isFlipped && players[t].isFlipped && hitLeftSide) || (this.isFlipped && !players[t].isFlipped && hitLeftSide) ||
                (!this.isFlipped && players[t].isFlipped && hitRightSide) || (!this.isFlipped && !players[t].isFlipped && hitRightSide)){
                players[t].HP-= this.size/5;
                if(players[t].HP<=0){
                  this.XP += players[t].XP*0.75;
                  this.progressXP += players[t].XP*0.75;
                  this.size = this.getSize();
                  this.HP += players[t].maxHP/2

                  players[t].die();
                }
              }
              if((!players[t].isFlipped && !this.isFlipped && hitLeftSide) || (!players[t].isFlipped && this.isFlipped && hitLeftSide) ||
                (players[t].isFlipped && !this.isFlipped && hitRightSide) || (players[t].isFlipped && this.isFlipped && hitRightSide)){
                this.HP-= players[t].size/5;
                if(this.HP<=0){
                  players[t].XP += this.XP*0.75;
                  players[t].progressXP += this.XP*0.75;
                  players[t].size = players[t].getSize();
                  players[t].HP += this.maxHP/2

                  this.die();
                }
              }
            }
          }
				}
			}
		}
  }
  
	this.handlePlantXP = function(){
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

    for(let i in plants){
      if(Math.sqrt(Math.pow(headX-plants[i].flower.x,2)+Math.pow(headY-plants[i].flower.y,2))< (range+plants[i].flower.size/2)){
        if(plants[i].hasFlower){
          plants[i].hasFlower = false;
          this.XP+= plants[i].flower.XP;
          this.progressXP+= plants[i].flower.XP;
          this.size = this.getSize();

          // this.HP += (this.maxHP/15); //for eating the flower

          sendPlantUpdate();
        } 
      }
      for(let j in plants[i].leaves){
        if(Math.sqrt(Math.pow(headX-plants[i].leaves[j].x,2)+Math.pow(headY-plants[i].leaves[j].y,2))< (range+plants[i].leaves[j].size/2)){
          if(plants[i].hasLeaf[j]){
            plants[i].hasLeaf[j] = false;
            this.XP+= plants[i].leaves[j].XP;
            this.progressXP+= plants[i].leaves[j].XP;
            this.size = this.getSize();

            sendPlantUpdate();
          } 
        }
      }
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
              if(Math.abs(players[t].x-this.x)<((this.size/2+players[t].size/2)+(150))){
                if(players[t].x>this.x){
                  players[t].bumpForce = this.size/10;
                }
                if(players[t].x<this.x){
                  players[t].bumpForce = -(this.size/10);
                }
              }
            }
          }
          for(let b in bots){
            if(Math.abs(bots[b].x-this.x)<((this.size/2+bots[b].size/2)+(150))){
              if(bots[b].x>this.x){
                bots[b].bumpForce = this.size/10;
              }
              if(bots[b].x<this.x){
                bots[b].bumpForce = -(this.size/10);
              }
            }
          }
          // var crack = new Crack(this.x, 0, 600, this.isFlipped);
          // cracks.push(crack);
          // socket.emit("crackInitPack", {crackInitPack: crack.getInitPack()});
        }
        break;
      case "JumpStomp":
        this.y -= this.jumpDelta;
        this.jumpDelta -= this.gravity;
        if(this.y>0){
          this.y = 0;
          this.jumpDelta = this.jumpForce;
          this.abilityTimer = 0;
          for(let t in players){
            if(players[t].id != this.id){
              if(Math.abs(players[t].x-this.x)<((this.size/2+players[t].size/2)+(150))){
                if(players[t].x>this.x){
                  players[t].bumpForce = this.size/10;
                }
                if(players[t].x<this.x){
                  players[t].bumpForce = -(this.size/10);
                }
              }
            }
          }
          for(let b in bots){
            if(Math.abs(bots[b].x-this.x)<((this.size/2+bots[b].size/2)+(150))){
              if(bots[b].x>this.x){
                bots[b].bumpForce = this.size/10;
              }
              if(bots[b].x<this.x){
                bots[b].bumpForce = -(this.size/10);
              }
            }
          }
          // var crack = new Crack(this.x, 0, 600, this.isFlipped);
          // cracks.push(crack);
          // socket.emit("crackInitPack", {crackInitPack: crack.getInitPack()});
        }
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
              if(Math.abs(players[t].x-this.x)<((this.size/2+players[t].size/2)+(300))){
                if(players[t].x>this.x){
                  players[t].bumpForce = this.size/8;
                }
                if(players[t].x<this.x){
                  players[t].bumpForce = -(this.size/8);
                }
              }
            }
          }
          for(let b in bots){
            if(Math.abs(bots[b].x-this.x)<((this.size/2+bots[b].size/2)+(300))){
              if(bots[b].x>this.x){
                bots[b].bumpForce = this.size/8;
              }
              if(bots[b].x<this.x){
                bots[b].bumpForce = -(this.size/8);
              }
            }
          }
          // var crack = new Crack(this.x, 0, 600, this.isFlipped);
          // cracks.push(crack);
          // socket.emit("crackInitPack", {crackInitPack: crack.getInitPack()});
        }
      	break;
      case "Dash":
      	//do nothing, only increases speed
        break;
      case "Charge":
      	//do nothing, only increases speed
        break;
      case "Hide":
        //heal in hide
        this.HP+= this.maxHP/600
        break;
      default:
        break;
      }
      this.abilityTimer -= 1;
    }
		if(this.abilityTimer <= 0){
			this.doingAbility = false;
		}
	}
  
  
  this.die = function(){
    this.x = Math.random()*mapSize;
    this.XP *= 0.25;
    this.upgrade = 1; //player on first upgrade
    this.targetXP = 20;
    this.size = this.getSize();
    this.walkSpeed = 1.5;
    this.bumpForce = 0;
    this.abilityCardsActive = false;
    this.abilityCards = [];
    this.abilitySet = [];
    this.maxHP = this.size;
    this.HP = this.maxHP;
    this.shellType = "Box";
  }
  
  this.reset = function(){
    this.x = Math.random()*mapSize;
    this.XP = 5;
    this.progressXP = 5;
    this.upgrade = 1; //player on first upgrade
    this.targetXP = 20;
    this.size = this.getSize();
    this.walkSpeed = 1.5;
    this.bumpForce = 0;
    this.abilityCardsActive = false;
    this.abilityCards = [];
    this.abilitySet = [];
    this.maxHP = this.size;
    this.HP = this.maxHP;
    this.shellType = "Box";
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
    
    for(let i in this.cooldownSet){
      if(this.cooldownSet[i] != 0 && !(this.doingAbility)){
        this.cooldownSet[i] -= 1;
      }
    }
    
    var ratio = this.size/this.maxHP;
    this.maxHP = this.size;
    this.HP *= ratio; //scales HP with size
    if((this.HP+0.01)>this.maxHP){
      this.HP = this.maxHP;
    }
    
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
    
    if(this.doingAbility){
			this.playAbility(this.whatAbility);
		}
    
    if(!(this.doingAbility && (this.whatAbility === "BoxRoll" || this.whatAbility === "DomeRoll" || this.whatAbility === "SpikeRoll"  || this.whatAbility === "JumpStomp"))){
      this.handlePlantXP();
    }
    if(1){
      this.handleCollisions();
    }
    
    this.animateLegs();
    
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
    if(this.progressXP>this.targetXP){
      if(this.abilitySet.length===maxAbilityCards){
        if(this.upgrade === 3){ //you are not adding a card on upgrade 3, you are upgrading one. so allowed
          this.doUpgrade(this.upgrade);
        }
      } else{
        this.doUpgrade(this.upgrade);
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
      isDeveloper: this.isDeveloper,
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
      cooldownLength: this.cooldownLength,
      cooldownSet: this.cooldownSet,
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

var Bot = function(id, x, y, XP){
  
  this.getSize = function(){
    var modifier = 3000;
    var startingSize = 120;
    var maxSize = 1000;
    return (((this.XP*(maxSize-startingSize))/(this.XP+modifier))+startingSize);
  }
  
  this.id = id;
  this.x = x;
  this.y = 0;
  this.XP = XP
  this.size = this.getSize();
  this.bumpForce = 0;
  this.maxHP = this.size;
  this.HP = this.size;
  if((Math.random()*10)>5){
    this.isFlipped = false;
  } else{
    this.isFlipped = true;
  }
  this.frontLegUp = 1;
  this.walkSpeed = 1.15;
  this.legDirX = 1;
  this.legOffsetX = 0;
  this.legOffsetY = 0;

  this.animateLegs = function(){
    this.legOffsetX+=this.walkSpeed*this.legDirX;
    if(this.legOffsetX>0.02*this.size){
      this.legOffsetX=(0.02*this.size);
      this.legDirX = -1;
      this.frontLegUp = !this.frontLegUp;
    }else if(this.legOffsetX<-0.02*this.size){
      this.legOffsetX=(-0.02*this.size);
      this.legDirX = 1;
      this.frontLegUp = !this.frontLegUp;
    }
  }

  this.die = function(){
    this.x = Math.random()*mapSize;
    this.XP = Math.random()*200;
    this.size = this.getSize();
    this.maxHP = this.size;
    this.HP = this.maxHP;
  }

  this.update = function() {
    if(this.bumpForce != 0){ //main game physics
      this.bumpForce *= 0.9;
      if(Math.abs(this.bumpForce)<0.1){
        this.bumpForce = 0;
      }
      if(this.x<mapSize && this.x>0){
        this.x+=this.bumpForce;
      }
    }
    this.animateLegs();
    if(!(this.isFlipped)){
      this.x += this.walkSpeed;
    } else{
      this.x -= this.walkSpeed;
    }
    if(this.x<0){
      this.isFlipped = false;
      this.x = 0
    }
    if(this.x>mapSize){
      this.isFlipped = true;
      this.x = mapSize
    }
  }
  this.getInitPack = function () {
    return {
      id: this.id,
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
      isFlipped: this.isFlipped,
      frontLegUp: this.frontLegUp,
      legOffsetX: this.legOffsetX,
      legOffsetY: this.legOffsetY,
      maxHP: this.maxHP,
      HP: this.HP,
    }
  }
  return this;
}

function getAllBotsInitPack() {
    var botInitPack = [];
    for(let i in bots) {
        botInitPack.push(bots[i].getInitPack());
    }
    return botInitPack;
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

var Crack = function(x, y, size, isFlipped){
  this.x = x;
	this.y = y;
  this.size = size;
	this.isFlipped = isFlipped;
  
  this.update = function(){
    ;
  }
  
  this.getInitPack = function () { //base information that can be updated
		return {
			x: this.x,
			y: this.y,
			size: this.size,
			isFlipped: this.isFlipped,
		}
	}
  
  return this;
}

function getAllCracksInitPack() {
    var crackInitPack = [];
    for(let i in cracks) {
        crackInitPack.push(cracks[i].getInitPack());
    }
    return crackInitPack;
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

    var botUpdatePack = [];

    for(let i in bots) {
        bots[i].update();
        botUpdatePack.push(bots[i].getUpdatePack());
    }
  
    io.emit("updatePack", {updatePack});

    io.emit("botUpdatePack", {botUpdatePack});
}, 35)

setInterval(() => {
  for(let i in plants) {
    if(Math.floor(Math.random()*3)===0){
      for(let j in plants[i].hasLeaf){
        if(plants[i].hasLeaf[j] === false){
          if(Math.floor(Math.random()*5)===0){
            plants[i].hasLeaf[j] = true;
          }
        }
      }
      if(plants[i].hasFlower === false){
        if(Math.floor(Math.random()*7)===0){
          plants[i].hasFlower = true;
        }
      }
      sendPlantUpdate();
    }
  }
}, 5000)
