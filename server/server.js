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

var chatLog = [];

var players = [];
var grass = [];
var flowers = [];
var ladybugs = [];
var ants = [];
var spiders = [];

var maxabilityChoices = 4; //probably will want to change this

//needs to be changed in BOTH server and client
var biomeSize = 6000;

var XPtargets = [5, 20, 30, 40, 70]; //requred to pass 0, 1, 2, 3, 4

server.listen(port, function(){//when the server starts, generate the map with this function
	var flower = {};
	for(let i = 0; i< (biomeSize/250); i++){
		flower = new Flower(i, biomeSize+Math.random()*biomeSize, 250+(Math.random()*300), true, true, "white");
		flowers.push(flower);
	}
	for(let i = 0; i< (biomeSize/300); i++){
		//we are using i+(biomeSize) so that multiple flowerHeads dont have the same index
		flower = new Flower(i+(biomeSize), biomeSize+biomeSize+Math.random()*biomeSize, 250+(Math.random()*300), true, true, "yellow");
		flowers.push(flower);
	}
	var patch = {};
	for(let i = 0; i< (biomeSize/1000); i++){
		patch = new Grass(i, Math.random()*biomeSize, 200+(Math.random()*75));
		grass.push(patch);
	}
	for(let i = 0; i< (biomeSize/1000); i++){
		//we are using i+(biomeSize) so that multiple grass dont have the same index
		patch = new Grass(i+(biomeSize), biomeSize+Math.random()*biomeSize, 250+(Math.random()*100));
		grass.push(patch);
	}
	for(let i = 0; i< (biomeSize/250); i++){
		//we are using i+(biomeSize*2) so that multiple grass dont have the same index
		patch = new Grass(i+(biomeSize*2), biomeSize+biomeSize+Math.random()*biomeSize, 250+(Math.random()*100));
		grass.push(patch);
	}
	var ant = {};
	for(let i = 0; i<5; i++){
		ant = new Ant(i, (Math.random()*biomeSize), 0, 50+(Math.random()*150));
		ants.push(ant);
	}
	var ladybug = {};
	for(let i = 0; i<5; i++){
		ladybug = new Ladybug(i, biomeSize+(Math.random()*biomeSize), 0, 50+(Math.random()*150));
		ladybugs.push(ladybug);
	}
	var spider = {};
	for(let i = 0; i<5; i++){
		spider = new Spider(i, biomeSize+biomeSize+(Math.random()*biomeSize), 0, 100+(Math.random()*900));
		spiders.push(spider);
	}
	console.log("Server Started on port "+ port +"!");
});

io.on('connection', function(socket) {
	console.log('someone connected, Id: ' + socket.id);
	var player = {};


	//not for beta dev version  
	socket.on("loadedPage", (data) =>{
		socket.emit("initPack", {initPack: getAllPlayersInitPack()});
		socket.emit("grassInitPack", {grassInitPack: getAllGrassInitPack()});
		socket.emit("flowerInitPack", {flowerInitPack: getAllFlowersInitPack()});
		socket.emit("ladybugInitPack", {ladybugInitPack: getAllLadybugsInitPack()});
		socket.emit("antInitPack", {antInitPack: getAllAntsInitPack()});
		socket.emit("spiderInitPack", {spiderInitPack: getAllSpidersInitPack()});
	})

	socket.on("imReady", (data) => { //player joins
		var playerDeveloper
		if(data.name === "?PROCTOR++%!"){ //its a secret shhh
			playerDeveloper = true
			data.name = "Proctor - DEV"
		} else{
			playerDeveloper = false
		}

		//the player can initially spawn in any biome EXCEPT jungle (very dangerous biome)
		player = new Player(socket.id, data.name, (Math.random()*(biomeSize*2)),0, 5, playerDeveloper);

		players.push(player);

		socket.emit("yourId", {id: player.id});
		socket.broadcast.emit('newPlayer', player.getInitPack()); //sends new guy's data to everyone
		socket.emit("initPack", {initPack: getAllPlayersInitPack()}); //sends everyone's data to new guy
		socket.emit("grassInitPack", {grassInitPack: getAllGrassInitPack()});
		socket.emit("flowerInitPack", {flowerInitPack: getAllFlowersInitPack()});
		socket.emit("ladybugInitPack", {ladybugInitPack: getAllLadybugsInitPack()});
		socket.emit("antInitPack", {antInitPack: getAllAntsInitPack()});
		socket.emit("spiderInitPack", {spiderInitPack: getAllSpidersInitPack()});
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


	function isCommandInChat(command, chatMsg) {
    	return chatMsg.includes(command);
	}

	socket.on("chatMessage", (data) => {
		
		var thisMessagePack = {}
		thisMessagePack.message = data.chatMessage
		thisMessagePack.id = player.id

		var isDevCommand = true //assume this for safety

		// Using match with regEx
    	let matches = thisMessagePack.message.match(/(\d+)/);
    
    	let commandSettingValue = 0
    	// Display output if number extracted
    	if (matches) {
        	commandSettingValue = matches[0]
    	}

		if(player.isDeveloper){
			switch(true){
				case isCommandInChat("/reset_all", thisMessagePack.message):
				for(let i in players){
					players[i].reset()
				}
				break
				case isCommandInChat("/reset_me", thisMessagePack.message):
				player.reset()
				break

				case isCommandInChat("/sizeset_all", thisMessagePack.message):
				for(let i in players){
					players[i].XP = commandSettingValue
					players[i].progressXP = commandSettingValue
				}
				break
				case isCommandInChat("/sizeset_me", thisMessagePack.message):
				player.XP = commandSettingValue
				player.progressXP = commandSettingValue
				break
				
				case isCommandInChat("/speedset_all", thisMessagePack.message):
				for(let i in players){
					players[i].walkSpeed = commandSettingValue
				}
				break
				case isCommandInChat("/speedset_me", thisMessagePack.message):
				player.walkSpeed = commandSettingValue
				break

				default:
				isDevCommand = false
				break
			}
		} else{
			isDevCommand = false
		}

		if(!isDevCommand){
			socket.broadcast.emit("getChat", {messagePack: thisMessagePack}); //send to everyone else
			socket.emit("getChat", {messagePack: thisMessagePack}); //send back to sender
		}

	})


	socket.on("usedAbility", (data) =>{

		if(player.cooldownSet[data.whatAbility] === 0 && !(player.doingAbility && player.whatAbility === "jumpStomp")){
			switch(player.abilityCards[data.whatAbility]){
			case "boxRoll":
				player.abilityTimer = boxRollTime;
				player.cooldownLength[data.whatAbility] = boxRollCooldown;
				player.cooldownSet[data.whatAbility] = boxRollCooldown;
				player.shellType = "Box";
				break;
			case "domeRoll":
				player.abilityTimer = domeRollTime;
				player.cooldownLength[data.whatAbility] = domeRollCooldown;
				player.cooldownSet[data.whatAbility] = domeRollCooldown;
				player.shellType = "Dome";
				break;
			case "spikeRoll":
				player.abilityTimer = spikeRollTime;
				player.cooldownLength[data.whatAbility] = spikeRollCooldown;
				player.cooldownSet[data.whatAbility] = spikeRollCooldown;
				player.shellType = "Spike";
				break;
			case "hide":
				player.abilityTimer = hideTime;
				player.cooldownLength[data.whatAbility] = hideCooldown;
				player.cooldownSet[data.whatAbility] = hideCooldown;
				break;
			case "porcupine":
				player.abilityTimer = porcupineTime;
				player.cooldownLength[data.whatAbility] = porcupineCooldown;
				player.cooldownSet[data.whatAbility] = porcupineCooldown;
				player.shellType = "Porcupine";
				break;
			case "stomp":
				player.abilityTimer = stompTime;
				player.cooldownLength[data.whatAbility] = stompCooldown;
				player.cooldownSet[data.whatAbility] = stompCooldown;
				break;
			case "jumpStomp":
				player.abilityTimer = jumpStompTime;
				player.cooldownLength[data.whatAbility] = jumpStompCooldown;
				player.cooldownSet[data.whatAbility] = jumpStompCooldown;
				break;
			case "shockwave":
				player.abilityTimer = shockwaveTime;
				player.cooldownLength[data.whatAbility] = shockwaveCooldown;
				player.cooldownSet[data.whatAbility] = shockwaveCooldown;
				break;
			case "dash":
				player.abilityTimer = dashTime;
				player.cooldownLength[data.whatAbility] = dashCooldown;
				player.cooldownSet[data.whatAbility] = dashCooldown;
				break;
			case "charge":
				player.abilityTimer = chargeTime;
				player.cooldownLength[data.whatAbility] = chargeCooldown;
				player.cooldownSet[data.whatAbility] = chargeCooldown;
				break;
			default:
				console.log("Ability doesnt exist");
				player.abilityTimer = 0;
				break;
			}
			player.whatAbility = player.abilityCards[data.whatAbility];
			player.doingAbility = true;
			player.bodyAngle = 0;

		}

		if(player.isDeveloper){
			player.cooldownSet[data.whatAbility] = 0
		}
			
	})

	socket.on("doJump", (data) =>{
		if(player.jumpCooldown == 0){
			player.abilityTimer = jumpTime
			player.whatAbility = "jump"
			player.doingAbility = true;
			player.jumpCooldown = jumpCooldown
		}
		
	})

	socket.on("doBoost", (data) =>{
		if(player.boostCooldown == 0){
			player.abilityTimer = boostTime
			player.whatAbility = "boost"
			player.doingAbility = true;
			player.boostCooldown = boostCooldown
		}
		
	})

	socket.on("choseCard", (data) =>{
		player.abilityChoicesActive = false;
		if(player.upgrade!=3 && player.abilityChoices[data.abilityCard] != "porcupine"){
			if(player.upgrade!=4){
				player.abilityCards.push(player.abilityChoices[data.abilityCard]);
				player.cooldownLength.push(0);
				player.cooldownSet.push(0);
			}
		} else{ //upgrade existing ability instead
			player.abilityCards[player.abilityCards.length-1] = player.abilityChoices[data.abilityCard];
			player.cooldownLength[player.abilityCards.length-1] = 0;
			player.cooldownSet[player.abilityCards.length-1] = 0;
		}
		player.abilityChoices = []; //stops hacking by making indices worthless after used
		
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
			player.XP += 50
			player.size = player.getSize();
			player.upgrade = 2;
			break;
		default:
			break;
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

var detectionRange = 0.25

var boxRollTime = 40;
var domeRollTime = 40;
var spikeRollTime = 10;
var hideTime = 120;
var porcupineTime = 100;
var stompTime = 5;
var jumpStompTime = 100000; //max ticks turtle can be in air for
var shockwaveTime = 20;
var dashTime = 30;
var chargeTime = 30;

var boostTime = 10;
var boostCooldown = 35;

var jumpTime = 100000;
var jumpCooldown = 60;

var boxRollCooldown = 250;
var domeRollCooldown = 500;
var spikeRollCooldown = 280;
var hideCooldown = 400;
var porcupineCooldown = 400;
var stompCooldown = 200;
var jumpStompCooldown = 300;
var shockwaveCooldown = 250;
var dashCooldown = 200;
var chargeCooldown = 250;


var boxRollAngle = (3.14159*1)/boxRollTime;
var domeRollAngle = (3.14159*2)/domeRollTime;
var spikeRollAngle = (3.14159/2)/spikeRollTime;

var alwaysMoveList = ["boxRoll", "domeRoll", "spikeRoll", "boost", "dash", "charge"]
var endOnCollisionList = ["boxRoll", "domeRoll", "boost", "dash"]
var weakenOnCollisionList = ["spikeRoll","charge"]

var names = ["CarlSim", "Bob", "boxt.io", "Noob", ".", "Carl", "KingOfBoxt", "ERROR"];

function checkCollision(objA_X, objA_Y, objA_Size, objB_X, objB_Y, objB_Size){
	if(
		objA_X+(objA_Size)/2 >= objB_X-(objB_Size)/2 &&
		objA_X-(objA_Size)/2 <= objB_X+(objB_Size)/2 &&
		objA_Y+(objA_Size)/2 >= objB_Y-(objB_Size)/2 &&
		objA_Y-(objA_Size)/2 <= objB_Y+(objB_Size)/2
	){
		return true
	}
	return false
		
}

var Player = function(id, name, x, y, XP, isDeveloper){
	
	this.getSize = function(){
		var modifier = 4000;
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
	this.abilityCards = [];
	this.cooldownLength = []; //total cooldown
	this.jumpCooldown = 0;
	this.boostCooldown = 0;
	this.cooldownSet = []; //cooldown left
	this.bodyAngle = 0;

	this.abilityChoices = [];
	this.abilityChoicesActive = false;

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
	this.walkSpeed = 2;
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
			case "boxRoll":
				return (boxRollAngle)*this.size;
				break;
			case "domeRoll":
				return (domeRollAngle)*this.size;
				break;
			case "spikeRoll":
				return (spikeRollAngle)*this.size;
				break;
			case "stomp":
				return this.walkSpeed/2;
				break;
			case "jumpStomp":
				return this.walkSpeed*8;
				break;
			case "jump":
				return this.walkSpeed*10;
				break;
			case "shockwave":
				return this.walkSpeed/2;
				break;
			case "boost":
				return this.walkSpeed*5;
			case "dash":
				return this.walkSpeed*5;
			case "charge":
				return this.walkSpeed*10;
			case "hide":
				return 0;
				break;
			case "porcupine":
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
		if(!(this.abilityChoicesActive)){
			switch(upgrade){
			case 1:
				this.abilityChoicesActive = true;
				this.abilityChoices = ["hide"];
				break;
			case 2:
				this.abilityChoicesActive = true;
				if(this.x > biomeSize){
					this.abilityChoices = ["boxRoll", "stomp", "dash"];
				} else{
					if(this.abilityCards.length === 1){
						this.abilityChoices = ["porcupine", "dash"];
					} else{
						this.abilityChoices = ["dash"];
					}
					
				}
				
				break;
			case 3:
				this.abilityChoicesActive = true;
				switch(this.abilityCards[this.abilityCards.length-1]){
				case "boxRoll":
					this.abilityChoices = ["domeRoll", "spikeRoll"];
					break;
				case "stomp":
					this.abilityChoices = ["jumpStomp", "shockwave"];
					break;
				case "dash":
					this.abilityChoices = ["charge"];
					break;
				case "porcupine":
					this.abilityChoices = ["bombShell"];
					break;
				default:
					console.log("ability cannot be upgraded");
					this.abilityChoices = ["ERROR"];
					break;
				}
				break;
			case 4:
				this.abilityChoicesActive = true;
				this.abilityChoices = ["Grow Turtle!"];
				break;
			default:
				break;
			}
		}
	}
	
	this.handleCollisions = function(){

		var headX
		var headY
		var range
		if(!(this.isFlipped)){
			headX = this.x+this.size*0.65
		} else{
			headX = this.x-this.size*0.65
		}
		headY = this.y-this.size*0.1
		range = this.size*0.2

		for (let b in ants){

			var bodyCollisionState = checkCollision(this.x, this.y-this.size*0.5, this.size, 
													ants[b].x, ants[b].y-ants[b].size*0.5, ants[b].size)
			var headBodyCollisionState = checkCollision(headX,headY,range,
													ants[b].x,ants[b].y-ants[b].size*0.5,ants[b].size)
			if(bodyCollisionState || headBodyCollisionState){
				if(this.doingAbility && this.whatAbility == "porcupine"){
					ants[b].HP -= this.maxHP/10
				}
				if(this.doingAbility && weakenOnCollisionList.includes(this.whatAbility)){
					this.abilityTimer /= 5
				}
				if(this.doingAbility && endOnCollisionList.includes(this.whatAbility)){
					this.doingAbility = false
				}
				if(headBodyCollisionState){
					if(!(this.doingAbility && (this.whatAbility == "hide" || this.whatAbility == "porcupine"))){
						ants[b].HP -= this.maxHP/5
					}
				}
				if(this.x>ants[b].x){
					ants[b].isFlipped = false
					ants[b].bumpForce = -5
					this.bumpForce = 5
				} else{
					ants[b].isFlipped = true
					ants[b].bumpForce = 5
					this.bumpForce = -5
				}
			}
			if(ants[b].HP<=0){
				this.XP+=ants[b].XP*0.75
				this.progressXP+=ants[b].XP*0.75
				this.HP += ants[b].maxHP/2.5
				ants[b].die()
			}
		}

		for (let b in ladybugs){

			var bodyCollisionState = checkCollision(this.x, this.y-this.size*0.5, this.size, 
											ladybugs[b].x, ladybugs[b].y-ladybugs[b].size*0.5, ladybugs[b].size)
			var headBodyCollisionState = checkCollision(headX,headY,range,
											ladybugs[b].x,ladybugs[b].y-ladybugs[b].size*0.5,ladybugs[b].size)

			if(bodyCollisionState || headBodyCollisionState){
				if(this.doingAbility && this.whatAbility == "porcupine"){
					ladybugs[b].HP -= this.maxHP/10
				}
				if(this.doingAbility && weakenOnCollisionList.includes(this.whatAbility)){
					this.abilityTimer /= 5
				}
				if(this.doingAbility && endOnCollisionList.includes(this.whatAbility)){
					this.doingAbility = false
				}
				if(headBodyCollisionState){
					if(!(this.doingAbility && (this.whatAbility == "hide" || this.whatAbility == "porcupine"))){
						ladybugs[b].HP -= this.maxHP/5
					}
				}
				if(this.x>ladybugs[b].x){
					ladybugs[b].isFlipped = true
					ladybugs[b].bumpForce = -5
					this.bumpForce = 5
				} else{
					ladybugs[b].isFlipped = false
					ladybugs[b].bumpForce = 5
					this.bumpForce = -5
				}
			}
			if(ladybugs[b].HP<=0){
				this.XP+=ladybugs[b].XP*0.75
				this.progressXP+=ladybugs[b].XP*0.75
				this.HP += ladybugs[b].maxHP/2.5
				ladybugs[b].die()
			}
		}
		
		for (let b in spiders){

			var bodyCollisionState = checkCollision(this.x, this.y-this.size*0.5, this.size, 
														spiders[b].x, spiders[b].y-spiders[b].size*0.5, spiders[b].size)
			var headBodyCollisionState = checkCollision(headX,headY,range,
														spiders[b].x,spiders[b].y-spiders[b].size*0.5,spiders[b].size)

			if(bodyCollisionState || headBodyCollisionState){
				if(this.doingAbility && this.whatAbility == "porcupine"){
					spiders[b].HP -= this.maxHP/10
				}
				if(this.doingAbility && weakenOnCollisionList.includes(this.whatAbility)){
					this.abilityTimer /= 5
				}
				if(this.doingAbility && endOnCollisionList.includes(this.whatAbility)){
					this.doingAbility = false
				}
				if(headBodyCollisionState){
					if(!(this.doingAbility && (this.whatAbility == "hide"|| this.whatAbility == "porcupine"))){
						spiders[b].HP -= this.maxHP/5
					}
				}
				if(this.x>spiders[b].x){
					spiders[b].isFlipped = false
					spiders[b].bumpForce = -5
					this.bumpForce = 5
				} else{
					spiders[b].isFlipped = true
					spiders[b].bumpForce = 5
					this.bumpForce = -5
				}
				if(!(this.doingAbility && (this.whatAbility == "hide" || this.whatAbility == "porcupine"))){
					this.HP -= spiders[b].maxHP/5
				}
			}
			if(spiders[b].HP<=0){
				this.XP+=spiders[b].XP*0.75
				this.progressXP+=spiders[b].XP*0.75
				this.HP += spiders[b].maxHP/2.5
				spiders[b].die()
			}
			if(this.HP<=0){
				spiders[b].XP+=this.XP*0.75
				spiders[b].HP += this.maxHP/2.5
				this.XP *= 0.25
				this.die()
			}
		}
		for(let t in players){
			if(players[t].id != this.id){

				var headX_B
				var headY_B
				var range_B
				if(!(players[t].isFlipped)){
					headX_B = players[t].x+players[t].size*0.65
				} else{
					headX_B = players[t].x-players[t].size*0.65
				}
				headY_B = players[t].y-players[t].size*0.1
				range_B = players[t].size*0.2

				var bodyCollisionState = checkCollision(this.x, this.y-this.size*0.5, this.size, 
											players[t].x, players[t].y-players[t].size*0.5, players[t].size)
				var headBodyCollisionState = checkCollision(headX, headY, range, 
											players[t].x, players[t].y-players[t].size*0.5, players[t].size)
				var headCollisionState = checkCollision(headX, headY, range, headX_B, headY_B, range_B)

				if(bodyCollisionState || headBodyCollisionState || headCollisionState){
					if(this.doingAbility && this.whatAbility == "porcupine"){
						players[t].HP -= this.maxHP/10
					}
					if(players[t].doingAbility && players[t].whatAbility == "porcupine"){
						this.HP -= players[t].maxHP/10
					}
					if(this.doingAbility && weakenOnCollisionList.includes(this.whatAbility)){
						this.abilityTimer /= 5
					}
					if(this.doingAbility && endOnCollisionList.includes(this.whatAbility)){
						this.doingAbility = false
					}
					if(players[t].doingAbility && weakenOnCollisionList.includes(players[t].whatAbility)){
						players[t].abilityTimer /= 5
					}
					if(players[t].doingAbility && endOnCollisionList.includes(players[t].whatAbility)){
						players[t].doingAbility = false
					}
					if(headBodyCollisionState){
						if(!(this.doingAbility && (this.whatAbility == "hide" || this.whatAbility == "porcupine"))){
							players[t].HP -= this.maxHP/5
						}
					}
					if(headCollisionState){
						if(!(this.doingAbility && (this.whatAbility == "hide" || this.whatAbility == "porcupine")) && !(players[t].doingAbility && players[t].whatAbility == "hide" || this.whatAbility == "porcupine")){
							players[t].HP -= this.maxHP/5
							this.HP -= players[t].maxHP/5
						}
					}
					if(this.x>players[t].x){
						players[t].bumpForce = -5
						this.bumpForce = 5
					} else{
						players[t].bumpForce = 5
						this.bumpForce = -5
					}
				}
				if(players[t].HP<=0){
					this.XP+=players[t].XP*0.75
					this.progressXP+=players[t].progressXP*0.75
					this.HP += players[t].maxHP/2.5
					players[t].XP *= 0.25
					players[t].die()
				}
				if(this.HP<=0){
					players[t].XP+=this.XP*0.75
					players[t].progressXP+=this.progressXP*0.75
					players[t].HP += this.maxHP/2.5
					this.XP *= 0.25
					this.die()
				}
			}
		}
	}
	
	this.handleFlowerXP = function(){
		var headX
		var headY
		var range
		if(!(this.isFlipped)){
			headX = this.x+this.size*0.65
		} else{
			headX = this.x-this.size*0.65
		}
		headY = this.y-this.size*0.35
		range = this.size*0.075;

		for(let i in flowers){
			if(Math.sqrt(Math.pow(headX-flowers[i].flowerHead.x,2)+Math.pow(headY-flowers[i].flowerHead.y,2))< (range+flowers[i].flowerHead.size/2)){
				if(flowers[i].hasFlowerHead){
					flowers[i].hasFlowerHead = false;
					this.XP+= flowers[i].flowerHead.XP;
					this.progressXP+= flowers[i].flowerHead.XP;

					// this.HP += (this.maxHP/15); //for eating the flowerHead

					sendFlowerUpdate();
				} 
			}
			for(let j in flowers[i].leaves){
				if(Math.sqrt(Math.pow(headX-flowers[i].leaves[j].x,2)+Math.pow(headY-flowers[i].leaves[j].y,2))< (range+flowers[i].leaves[j].size/2)){
					if(flowers[i].hasLeaf[j]){
						flowers[i].hasLeaf[j] = false;
						this.XP+= flowers[i].leaves[j].XP;
						this.progressXP+= flowers[i].leaves[j].XP;

						sendFlowerUpdate();
					} 
				}
			}
		}
	}

	this.playAbility = function(whatAbility){
		if(this.abilityTimer>0){
			switch(whatAbility){
			case "boxRoll":
				this.bodyAngle += boxRollAngle;
				break;
			case "domeRoll":
				this.bodyAngle += domeRollAngle;
				break;
			case "spikeRoll":
				this.bodyAngle += spikeRollAngle;
				break;
			case "stomp":
				if(this.abilityTimer === stompTime){
					this.legOffsetX = (upperLegBound*this.size)-(stompTime*this.getSpeed());
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
					for(let b in ladybugs){
						if(Math.abs(ladybugs[b].x-this.x)<((this.size/2+ladybugs[b].size/2)+(150))){
							if(ladybugs[b].x>this.x){
								ladybugs[b].bumpForce = this.size/10;
							}
							if(ladybugs[b].x<this.x){
								ladybugs[b].bumpForce = -(this.size/10);
							}
						}
					}
				}
				break;
			case "jumpStomp":
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
					for(let b in ladybugs){
						if(Math.abs(ladybugs[b].x-this.x)<((this.size/2+ladybugs[b].size/2)+(150))){
							if(ladybugs[b].x>this.x){
								ladybugs[b].bumpForce = this.size/10;
							}
							if(ladybugs[b].x<this.x){
								ladybugs[b].bumpForce = -(this.size/10);
							}
						}
					}
				}
				break;
			case "shockwave":
				if(this.abilityTimer === shockwaveTime){
					this.legOffsetX = (upperLegBound*this.size)-(shockwaveTime*this.getSpeed());
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
					for(let b in ladybugs){
						if(Math.abs(ladybugs[b].x-this.x)<((this.size/2+ladybugs[b].size/2)+(300))){
							if(ladybugs[b].x>this.x){
								ladybugs[b].bumpForce = this.size/8;
							}
							if(ladybugs[b].x<this.x){
								ladybugs[b].bumpForce = -(this.size/8);
							}
						}
					}
				}
				break;
			case "jump":
				this.y -= this.jumpDelta;
				this.jumpDelta -= this.gravity;
				if(this.y>0){
					this.y = 0;
					this.jumpDelta = this.jumpForce;
					this.abilityTimer = 0;
				}
				break;
			case "boost":
				//do nothing, only increases speed
				break;
			case "dash":
				//do nothing, only increases speed
				break;
			case "charge":
				//do nothing, only increases speed
				break;
			case "hide":
				//heal in hide
				this.HP+= this.maxHP/600
				break;
			case "porcupine":
				//do nothing
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
		if(this.xp >1500){
			this.x = Math.random()*biomeSize*3;
		} else{
			this.x = Math.random()*biomeSize*2;
		}
		this.upgrade = 1; //player on first upgrade
		this.targetXP = 20;
		this.size = this.getSize();
		this.walkSpeed = 1.5;
		this.bumpForce = 0;
		this.abilityChoicesActive = false;
		this.abilityChoices = [];
		this.abilityCards = [];
		this.maxHP = this.size;
		this.HP = this.maxHP;
		this.shellType = "Box";
	}
	
	this.reset = function(){
		this.x = Math.random()*biomeSize*3;
		this.XP = 5;
		this.progressXP = 5;
		this.upgrade = 1; //player on first upgrade
		this.targetXP = 20;
		this.size = this.getSize();
		this.walkSpeed = 1.5;
		this.bumpForce = 0;
		this.abilityChoicesActive = false;
		this.abilityChoices = [];
		this.abilityCards = [];
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
		
		this.size = this.getSize();
		
		for(let i in this.cooldownSet){
			if(this.cooldownSet[i] != 0 && !(this.doingAbility)){
				this.cooldownSet[i] -= 1;
			}
		}

		if(this.jumpCooldown != 0 && !(this.doingAbility && this.whatAbility == "jump")){
			this.jumpCooldown -=1;
		}

		if(this.boostCooldown != 0 && !(this.doingAbility && this.whatAbility == "boost")){
			this.boostCooldown -=1;
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
			if(this.x<biomeSize*3 && this.x>0){
				this.x+=this.bumpForce;
			}
		}
		
		
		if(this.distXToMouse<this.size*detectionRange){
			if(!(this.doingAbility && (alwaysMoveList.includes(this.whatAbility)))){
				this.doMovement = false;
			} else{
				this.doMovement = true;
			}
		} else{
			this.doMovement = true;
		}
		
		if(this.doingAbility){
			this.playAbility(this.whatAbility);
		}
		
		if(!(this.doingAbility && (this.whatAbility === "boxRoll" || this.whatAbility === "domeRoll" || this.whatAbility === "spikeRoll"  || this.whatAbility === "jump" || this.whatAbility === "jumpStomp"))){
			this.handleFlowerXP();
		}
		if(1){
			this.handleCollisions();
		}
		
		this.animateLegs();
		
		if(this.doMovement){
			if (!(this.isFlipped)) {
				if(this.x < biomeSize*3){
					this.x += this.getSpeed();
				}
			} else{
				if(this.x > 0){
					this.x -= this.getSpeed();
				}
			}
		}
		if(this.progressXP>this.targetXP){
			if(this.abilityCards.length===maxabilityChoices){
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
			abilityCards: this.abilityCards,
			abilityChoicesActive: this.abilityChoicesActive,
			abilityChoices: this.abilityChoices,
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

var Ant= function(id, x, y, XP){
	
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
		this.x = Math.random()*biomeSize;
		this.XP = Math.random()*200;
		this.size = this.getSize();
		this.maxHP = this.size;
		this.HP = this.maxHP;
	}

	this.update = function() {
		this.size = this.getSize();
		if(this.bumpForce != 0){ //main game physics
			this.bumpForce *= 0.9;
			if(Math.abs(this.bumpForce)<0.1){
				this.bumpForce = 0;
			}
			if(this.x<(biomeSize) && this.x>0){
				this.x+=this.bumpForce;
			}
		}
		
		var ratio = this.size/this.maxHP;
		this.maxHP = this.size;
		this.HP *= ratio; //scales HP with size
		if((this.HP+0.01)>this.maxHP){
			this.HP = this.maxHP;
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
		if(this.x>(biomeSize)){
			this.isFlipped = true;
			this.x = (biomeSize)
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


var Ladybug = function(id, x, y, XP){
	
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
		this.x = (biomeSize)+Math.random()*biomeSize;
		this.XP = Math.random()*200;
		this.size = this.getSize();
		this.maxHP = this.size;
		this.HP = this.maxHP;
	}

	this.update = function() {
		this.size = this.getSize();
		if(this.bumpForce != 0){ //main game physics
			this.bumpForce *= 0.9;
			if(Math.abs(this.bumpForce)<0.1){
				this.bumpForce = 0;
			}
			if(this.x<(biomeSize+biomeSize) && this.x>(biomeSize)){
				this.x+=this.bumpForce;
			}
		}
		
		var ratio = this.size/this.maxHP;
		this.maxHP = this.size;
		this.HP *= ratio; //scales HP with size
		if((this.HP+0.01)>this.maxHP){
			this.HP = this.maxHP;
		}
		
		
		this.animateLegs();
		if(!(this.isFlipped)){
			this.x += this.walkSpeed;
		} else{
			this.x -= this.walkSpeed;
		}
		if(this.x<(biomeSize)){
			this.isFlipped = false;
			this.x = (biomeSize)
		}
		if(this.x>(biomeSize+biomeSize)){
			this.isFlipped = true;
			this.x = (biomeSize+biomeSize)
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


var Spider = function(id, x, y, XP){
	
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
		this.x = (biomeSize+biomeSize)+Math.random()*biomeSize;
		this.XP = Math.random()*200;
		this.size = this.getSize();
		this.maxHP = this.size;
		this.HP = this.maxHP;
	}

	this.update = function() {
		this.size = this.getSize();
		if(this.bumpForce != 0){ //main game physics
			this.bumpForce *= 0.9;
			if(Math.abs(this.bumpForce)<0.1){
				this.bumpForce = 0;
			}
			if(this.x<(biomeSize+biomeSize+biomeSize) && this.x>(biomeSize+biomeSize)){
				this.x+=this.bumpForce;
			}
		}
		
		var ratio = this.size/this.maxHP;
		this.maxHP = this.size;
		this.HP *= ratio; //scales HP with size
		if((this.HP+0.01)>this.maxHP){
			this.HP = this.maxHP;
		}
		
		
		this.animateLegs();
		if(!(this.isFlipped)){
			this.x += this.walkSpeed;
		} else{
			this.x -= this.walkSpeed;
		}
		if(this.x<(biomeSize+biomeSize)){
			this.isFlipped = false;
			this.x = (biomeSize+biomeSize)
		}
		if(this.x>(biomeSize+biomeSize+biomeSize)){
			this.isFlipped = true;
			this.x = (biomeSize+biomeSize+biomeSize)
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

function getAllLadybugsInitPack() {
		var ladybugInitPack = [];
		for(let i in ladybugs) {
				ladybugInitPack.push(ladybugs[i].getInitPack());
		}
		return ladybugInitPack;
}

function getAllAntsInitPack() {
		var antInitPack = [];
		for(let i in ants) {
				antInitPack.push(ants[i].getInitPack());
		}
		return antInitPack;
}

function getAllSpidersInitPack() {
		var spiderInitPack = [];
		for(let i in spiders) {
				spiderInitPack.push(spiders[i].getInitPack());
		}
		return spiderInitPack;
}

var Grass = function(id, x, size){
	this.id = id
	this.x = x
	this.size = size
	this.getInitPack = function () { //base information that can be updated
		return {
			id: this.id,
			x: this.x,
			size: this.size, 
		}
	}
	this.getUpdatePack = function () {
		return {
			id:this.id,
		}
	}
	return this;

}

var Flower = function(id, x, height, hasFlowerHead, hasLeaf, flowerHeadColor){
	this.id = id;
	this.x = x;
	this.height = height;
	this.hasFlowerHead = true;
	this.flowerHeadColor = flowerHeadColor;
	this.flowerHead = new FlowerHead(x, -height, flowerHeadColor);
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
			hasFlowerHead: this.hasFlowerHead,
			hasLeaf: this.hasLeaf,
			flowerHeadColor: this.flowerHeadColor,
		}
	}
	this.getUpdatePack = function () {
		return {
			id: this.id,
			hasFlowerHead: this.hasFlowerHead,
			hasLeaf: this.hasLeaf,
			flowerHeadColor: this.flowerHeadColor,
		}
	}
	return this;
}

var FlowerHead = function(x,y, color){
	this.x = x;
	this.y = y;
	this.color = color
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

function getAllGrassInitPack() {
		var grassInitPack = [];
		for(let i in grass) {
				grassInitPack.push(grass[i].getInitPack());
		}
		return grassInitPack;
}

function getAllFlowersInitPack() {
		var flowerInitPack = [];
		for(let i in flowers) {
				flowerInitPack.push(flowers[i].getInitPack());
		}
		return flowerInitPack;
}

function sendFlowerUpdate() {
		var flowerUpdatePack = [];
	
		for(let i in flowers) {
				// flowers[i].update();
				flowerUpdatePack.push(flowers[i].getUpdatePack());
		}

		io.emit("flowerUpdatePack", {flowerUpdatePack});
		
}

setInterval(() => {
		var updatePack = [];

		for(let i in players) {
				players[i].update();
				updatePack.push(players[i].getUpdatePack());
		}

		var ladybugUpdatePack = [];

		for(let i in ladybugs) {
				ladybugs[i].update();
				ladybugUpdatePack.push(ladybugs[i].getUpdatePack());
		}

		var antUpdatePack = [];

		for(let i in ladybugs) {
				ants[i].update();
				antUpdatePack.push(ants[i].getUpdatePack());
		}

		var spiderUpdatePack = [];

		for(let i in spiders) {
				spiders[i].update();
				spiderUpdatePack.push(spiders[i].getUpdatePack());
		}
	
		io.emit("updatePack", {updatePack});

		io.emit("ladybugUpdatePack", {ladybugUpdatePack});

		io.emit("antUpdatePack", {antUpdatePack});

		io.emit("spiderUpdatePack", {spiderUpdatePack});
}, 35)

setInterval(() => {
	for(let i in flowers) {
		if(Math.floor(Math.random()*3)===0){
			for(let j in flowers[i].hasLeaf){
				if(flowers[i].hasLeaf[j] === false){
					if(Math.floor(Math.random()*5)===0){
						flowers[i].hasLeaf[j] = true;
					}
				}
			}
			if(flowers[i].hasFlowerHead === false){
				if(Math.floor(Math.random()*7)===0){
					flowers[i].hasFlowerHead = true;
				}
			}
			sendFlowerUpdate();
		}
	}
}, 5000)
