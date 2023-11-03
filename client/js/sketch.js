var socket;
var myPlayer;
var myId;

//leg has a total range of 20% of the turtle
var upperLegBound = 0.025;
var lowerLegBound = -0.075;

var mouseStopDist = 0.8;


//preload, setup, and draw are called by p5.js

var shellBox, shellDome, shellSpike;
var turtle, turtleHead, turtleJaw, turtleFoot, turtleTail;
var stem, leaf, flowerWhite, flowerYellow;
var HideUI, BoxRollUI, DomeRollUI, SpikeRollUI;

//needs to be changed in BOTH server and client
var mapSize = 6000;

//loads assets on start of game
function preload(){
	shellBox = loadImage('assets/shellBox.png');
	shellDome = loadImage('assets/shellDome.png');
  	shellSpike = loadImage('assets/shellSpike.png');
	// turtle = loadImage('assets/turtle.png');
	turtleHead = loadImage('assets/turtleHead.png');
	// turtleJaw = loadImage('assets/turtle.png');
	turtleFoot = loadImage('assets/turtleFoot.png');
	// turtleTail = loadImage('assets/turtle.png');
	stem = loadImage('assets/stem.png');
	leaf = loadImage('assets/leaf.png');
	flowerWhite = loadImage('assets/flowerWhite.png');
	flowerYellow = loadImage('assets/flowerYellow.png');

	HideUI = loadImage('assets/UI/hideUI.png');
	BoxRollUI = loadImage('assets/UI/boxRollUI.png');
	DomeRollUI = loadImage('assets/UI/domeRollUI.png');
	SpikeRollUI = loadImage('assets/UI/spikeRollUI.png');

	ladybug = loadImage('assets/ladybug.png');
	ladybugFoot = loadImage('assets/ladybugFoot.png');
}

var botNames = ["CarlSim", "Bob", "boxt.io", "Noob", ".", "Carl", "KingOfBoxt", "ERROR"];

//first thing that is called. Sets up everything
function setup() {
    players = [];
    myId = 0;

    plants = [];

    bots = [];

    socket = io();

    var playerName = botNames[Math.floor(Math.random()*(botNames.length))];
    
    socket.emit("imReady", {name: playerName});

    socket.on("yourId", function(data) {
        myId = data.id;
    });

    //this instance of client (this player) joining. (Only run once)
    socket.on("newPlayer", function(data) {
        var player = new Player(data.id, data.name, data.x, data.y, data.size);
        players.push(player);
        console.log("new player");
    });

    socket.on("initPack", function(data) {
        for(let i in data.initPack) {
            var player = new Player(data.initPack[i].id, data.initPack[i].name, data.initPack[i].x, data.initPack[i].y, data.initPack[i].size);
            players.push(player);
            console.log("player init with: "+myId);
        }
    });

    socket.on("updatePack", function(data) {
        for(let i in data.updatePack) {
            for(let j in players){ //every player
                if(players[j].id === data.updatePack[i].id) { //is this data for this player
                    players[j].x = data.updatePack[i].x;
                    players[j].y = data.updatePack[i].y;
                    players[j].progressXP = data.updatePack[i].progressXP;
                    players[j].XP = data.updatePack[i].XP;
                    players[j].targetXP = data.updatePack[i].targetXP;
                    players[j].maxHP = data.updatePack[i].maxHP;
                    players[j].HP = data.updatePack[i].HP;
                    players[j].upgrade = data.updatePack[i].upgrade;
                    players[j].size = data.updatePack[i].size;
                    players[j].doMovement = data.updatePack[i].doMovement;
                    players[j].legOffsetX = data.updatePack[i].legOffsetX;
                    players[j].frontLegUp = data.updatePack[i].frontLegUp;
                    players[j].isFlipped = data.updatePack[i].isFlipped;
                    players[j].shellType = data.updatePack[i].shellType;
                    players[j].headAngle = data.updatePack[i].headAngle;
                    players[j].bodyAngle = data.updatePack[i].bodyAngle;
                    players[j].doingAbility = data.updatePack[i].doingAbility;
                    players[j].whatAbility = data.updatePack[i].whatAbility;
                    players[j].abilitySet = data.updatePack[i].abilitySet;
                    players[j].abilityCardsActive = data.updatePack[i].abilityCardsActive;
                    players[j].abilityCards = data.updatePack[i].abilityCards;
                }
            }
        }
    });

    socket.on("plantInitPack", function(data) {
        for(let i in data.plantInitPack) {
            var plant = new Plant(data.plantInitPack[i].id, data.plantInitPack[i].x, data.plantInitPack[i].height,data.plantInitPack[i].hasFlower, data.plantInitPack[i].hasLeaf);
            plants.push(plant);
            console.log("plant init");
        }
    });

    socket.on("botInitPack", function(data) {
    	for(let i in data.botInitPack) {
    		var bot = new Bot(data.botInitPack[i].id, data.botInitPack[i].x, data.botInitPack[i].y, data.botInitPack[i].size);
    		bots.push(bot);
    		console.log("New Bot");
    	}
    });

    socket.on("plantUpdatePack", function(data) {
        for(let i in data.plantUpdatePack) {
            for(let j in plants) {
            	if(plants[j].id === data.plantUpdatePack[i].id) {
            		plants[j].hasFlower = data.plantUpdatePack[i].hasFlower;
            		plants[j].hasLeaf = data.plantUpdatePack[i].hasLeaf;
                // plants[j].leaves = data.plantUpdatePack[i].leaves;
            		// console.log("updated flower state as "+plants[j].hasFlower)
            	}
            }
        }
    });

    socket.on("botUpdatePack", function(data) {
        for(let i in data.botUpdatePack) {
            for(let j in bots) {
            	if(bots[j].id === data.botUpdatePack[i].id) {
            		bots[j].x = data.botUpdatePack[i].x;
            		bots[j].y = data.botUpdatePack[i].y;
            		bots[j].size = data.botUpdatePack[i].size;
            		bots[j].frontLegUp = data.botUpdatePack[i].frontLegUp;
            		bots[j].isFlipped = data.botUpdatePack[i].isFlipped;
            		bots[j].legOffsetX = data.botUpdatePack[i].legOffsetX;
            		bots[j].legOffsetY = data.botUpdatePack[i].legOffsetY;
                bots[j].maxHP = data.botUpdatePack[i].maxHP;
                bots[j].HP = data.botUpdatePack[i].HP;
            	}
            }
        }
    });

    socket.on("someoneLeft", function(data) {
        for(let i in players) {
            if(players[i].id === data.id) {
                players.splice(i, 1);
            }
        }
    });

	createCanvas(windowWidth,windowHeight);
	imageMode(CENTER);
	rectMode(CORNER);
	textAlign(CORNER, CORNER);
}

//called every frame
function draw(){
background(0, 0, 250); // it gets a hex/rgb color
  sendInputData();
  push();
  for(let i in players) {
    if(players[i].id === myId) {
      var adjustedX;
      if(players[i].isFlipped){
        adjustedX = ((width/2+players[i].size/2) - players[i].x);
      } else{
        adjustedX = ((width/2-players[i].size/2) - players[i].x);
      }
    var adjustedY = ((height*0.75+players[i].size/3.5) - players[i].y);
      translate(adjustedX, adjustedY); //zooming in to 1/3 up the player
    }
  }

  fill(0, 0, 200);
  rect(0, 0-adjustedY, mapSize, windowHeight);
  fill(0, 150, 0);
  rect(0, 0, mapSize, windowHeight-adjustedY);

  for(let i in plants) {
    plants[i].draw();
    for(let j in plants[i].leaves){
      if(plants[i].hasLeaf[j]){
        plants[i].leaves[j].draw();
      }
    }
  }
    
  for(let i in plants) {
    if(plants[i].hasFlower){
      plants[i].flower.draw();
    }
  }

  for(let i in bots) {
  	bots[i].draw();
  	if(bots[i].HP != bots[i].maxHP){
  		bots[i].drawStatus();
  	}
  }

  for(let i in players) {
    players[i].draw();
    if(players[i].HP != players[i].maxHP){
      players[i].drawStatus();
    }
    players[i].drawName();
  }

  pop();

  for(let i in players) {
      if(players[i].id === myId) {
        players[i].drawUI();
      }
  }
  fill('rgba(0,0,0, 0.8)');
  rect(windowHeight*0.02, windowHeight*0.02, windowHeight*0.25, windowHeight*0.3, 20);
  fill(0, 200, 0);
  textSize(17);
  textAlign(CENTER);
  text("LEADERBOARD", windowHeight*0.02, (windowHeight*0.045), windowHeight*0.25, windowHeight*0.03)
  textSize(15);
  textAlign(LEFT);

  var rankedPlayers = players;

  var count = 1;
  for(let i in rankedPlayers){
    if(rankedPlayers[i].id === myId){
        fill(255, 255, 0);
      }
      text(count + " | " + players[i].name + " : " + Math.round(players[i].XP), windowHeight*0.05, (windowHeight*0.08)+(windowHeight*0.03)*i, windowHeight*0.25, windowHeight*0.03);
      if(players[i].id === myId){
        fill(0, 200, 0);
      }
    count ++;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

var Player = function(id, name, x, y, size){
	this.id = id;
	this.name = name;
	this.x = x;
	this.y = y;
	this.size = size;
	this.progressXP = 0;
	this.targetXP = 10;
	this.upgrade = 1;
	this.isFlipped = false;
	this.headAngle = 0;

	this.XP = 0;

	this.doingAbility = false;
	this.abilitySet = [];
	this.whatAbility;
	this.bodyAngle = 0;

	this.abilityCardsActive = true;
	this.abilityCards = [];

	this.doMovement = true;
	this.frontLegUp = true;
	this.legOffsetX = 0;
	this.shellType = "Box";

	this.getAbilityImg = function(abilityName){
		var img;
		switch(abilityName){
		case "Hide":
			img = HideUI;
			break;
		case "BoxRoll":
			img = BoxRollUI;
			break;
		case "DomeRoll":
			img = DomeRollUI;
			break;
		case "SpikeRoll":
			img = SpikeRollUI;
			break;
		case "Stomp":
			img = turtleFoot;
			break;
		case "ERROR"://testing
			img = flowerYellow;
			break;
		default:
			console.log("ability image not found");
			img = flowerWhite;
			break;
    	}
    	return img;
	}
  
	this.drawName = function(){
		push();
		translate(this.x, this.y);
		fill(0, 0, 0);
		textSize(26);
		textAlign(CENTER);
		text(this.name, 0, -this.size*1.22);
		pop();
	 }
	  
	this.drawStatus = function(){
		var percentage = this.HP/this.maxHP
		if(this.HP>this.maxHP){
			percentage = 1.00
		}
		push();
		translate(this.x, this.y);
		fill(0, 100, 0);
		rect(-this.size/2, -this.size*1.22-27, this.size, windowWidth*0.025, 10)
		fill(0, 250, 0);
		rect(-this.size/2, -this.size*1.22-27, this.size*percentage, windowWidth*0.025, 10);
		pop();
	}

	this.drawUI = function(){
		var adjustedY = ((height*0.75+this.size/3.5) - this.y);
		var percentage = this.progressXP/this.targetXP;
		if(percentage > 1.00){//bar cant display over 100%
			percentage = 1.00
		}
		
		fill(0, 100, 0);
	    rect(windowWidth * 0.05, windowHeight*0.85, windowWidth*0.2, windowWidth*0.03, 20)
	    fill(0, 250, 0);
	    rect(windowWidth * 0.05, windowHeight*0.85, windowWidth*0.2*percentage, windowWidth*0.03, 20)


	    var c = 0; //we need to render ui positions forwards
	    for (let i = this.abilitySet.length - 1; i >= 0; i--) {
	      	fill(0, 50, 0);
	      	rect(windowWidth*0.95-(c*windowWidth/15+c*windowWidth/225)-windowWidth/15, 
	         	windowHeight*0.85-windowWidth/30,windowWidth/15,windowWidth/15, 10);

	        //we read ability list backwards
	      	var tileImg;
	      	tileImg = this.getAbilityImg(this.abilitySet[i]);

	      	image(tileImg, windowWidth*0.95-(c*windowWidth/15+c*windowWidth/225)-windowWidth/15+windowWidth/(15*2), //x
	          windowHeight*0.85,windowWidth/15,windowWidth/15); //y, width height

	      	fill(0, 255, 0);
	      	textSize(windowWidth/(15*6));
	      	textAlign(CENTER);
	      	text(this.abilitySet[i], windowWidth*0.95-(c*windowWidth/15+c*windowWidth/225)-windowWidth/15+windowWidth/(15*2), 
	         windowHeight*0.85 + windowWidth/40);

	      	c++;
    	}

    	if(this.abilityCardsActive){
	      	var totalMenuWidth = ((this.abilityCards.length)*(windowHeight/7)) + ((this.abilityCards.length-1)*(windowHeight/55));
	      	for(let i in this.abilityCards){
	        	fill(0, 50, 0);
	        	rect(windowWidth*0.5-(totalMenuWidth/2) + i*(windowHeight/7)+(i)*(windowHeight/55), 
	        		windowHeight*0.4-windowHeight/14,windowHeight/7,windowHeight/7, 10);

	        	var cardImg;
	        	cardImg = this.getAbilityImg(this.abilityCards[i]);

	        	image(cardImg, windowWidth*0.5-(totalMenuWidth/2) + i*(windowHeight/7)+(i)*(windowHeight/55) + windowHeight/14, //x
	            	windowHeight*0.4,windowHeight/7,windowHeight/7); //y, width height

	        	fill(0, 255, 0);
	        	textSize(windowHeight/(7*6));
	        	textAlign(CENTER);
	        	text(this.abilityCards[i], windowWidth*0.5-(totalMenuWidth/2) + i*(windowHeight/7)+(i)*(windowHeight/55) + windowHeight/14, 
	             windowHeight*0.4 + windowHeight/18);

	      	}
	  	}
  	}

	this.draw = function(){
		var shellImg;
		switch(this.shellType){
		case "Box":
			shellImg = shellBox;
			break;
		case "Dome":
			shellImg = shellDome;
			break;
		case "Spike":
			shellImg = shellSpike;
			break;
		default:
			console.log("shell not found");
			break;
		}

		push();
    translate(this.x, this.y);
    push();
		if(!(this.isFlipped)){
			scale(1, 1)
		} else{
			scale(-1, 1)
		}
		if(!(this.doingAbility && ((this.whatAbility === "BoxRoll" || this.whatAbility === "DomeRoll" || this.whatAbility === "SpikeRoll") || this.whatAbility === "Hide"))){
      if(this.doingAbility && (this.whatAbility === "Stomp" || this.whatAbility === "Shockwave")){
        if(this.frontLegUp){
            image(turtleFoot, this.size/4 +this.legOffsetX, -(this.size/4), this.size/3, this.size/3); //front (1)
            image(turtleFoot, -this.size/4-this.legOffsetX, -(this.size/6), this.size/3, this.size/3); //back (0)
          } else{
            image(turtleFoot, this.size/4 +this.legOffsetX, -(this.size/6), this.size/3, this.size/3); //front (1)
            image(turtleFoot, -this.size/4-this.legOffsetX, -(this.size/5.5), this.size/3, this.size/3); //back (0)
          }
      } else{
        if(this.doMovement){
            if(this.frontLegUp){
              image(turtleFoot, this.size/4 +this.legOffsetX, -(this.size/5.5), this.size/3, this.size/3); //front (1)
              image(turtleFoot, -this.size/4-this.legOffsetX, -(this.size/6), this.size/3, this.size/3); //back (0)
            } else{
              image(turtleFoot, this.size/4 +this.legOffsetX, -(this.size/6), this.size/3, this.size/3); //front (1)
              image(turtleFoot, -this.size/4-this.legOffsetX, -(this.size/5.5), this.size/3, this.size/3); //back (0)
            }
        } else{
            image(turtleFoot, this.size/4 +this.legOffsetX, -(this.size/6), this.size/3, this.size/3); //front (1)
            image(turtleFoot, -this.size/4-this.legOffsetX, -(this.size/6), this.size/3, this.size/3); //back (0)
        }
      }
      
			push();
			translate(this.size*0.55, -(this.size*0.35));
			if(!(this.isFlipped)){
				rotate(this.headAngle)
			} else{
				rotate(Math.PI-this.headAngle)
			}
			image(turtleHead, this.size*0.05, -(this.size*0.05), this.size*(120/300), this.size/3);
			pop();
		}
		push();
		translate(0, -(this.size/2)-(this.size/6));
		if(this.doingAbility){
			if(this.whatAbility === "BoxRoll" || this.whatAbility === "DomeRoll" || this.whatAbility === "SpikeRoll"){
				translate(0,0+(this.size*0.3));
				rotate(this.bodyAngle);
				image(shellImg, 0, -this.size*0.05, this.size, this.size);
			} else if(this.whatAbility === "Hide"){
				translate(0,0+(this.size/6));
				image(shellImg, 0, 0, this.size, this.size);
			} else{
				image(shellImg, 0, 0, this.size, this.size);
			}
		} else{
			image(shellImg, 0, 0, this.size, this.size);
		}
    	pop();
		pop();
		pop();
	}
	return this;
}

var Bot = function(id, x, y, size){
	this.id = id;
	this.x = x;
	this.y = 0;
	this.size = 200;
	this.isFlipped = true;
	this.frontLegUp = true;
	this.legOffsetX = 0;
	this.legOffsetY = 0;
	this.drawStatus = function(){
		var percentage = this.HP/this.maxHP
		if(this.HP>this.maxHP){
			percentage = 1.00
		}
		push();
		translate(this.x, this.y);
		fill(0, 100, 0);
		rect(-this.size/2, -this.size*1.22-27, this.size, windowWidth*0.025, 10)
		fill(0, 250, 0);
		rect(-this.size/2, -this.size*1.22-27, this.size*percentage, windowWidth*0.025, 10);
		pop();
	}
	this.draw = function(){
		push();
		translate(this.x, this.y);
		push();
		if(!(this.isFlipped)){
			scale(1, 1)
		} else{
			scale(-1, 1)
		}
		if(this.frontLegUp){
			image(ladybugFoot, this.size*(-1/9+1/4)+this.legOffsetX, -this.size/(5.5), this.size/3, this.size/3);
			image(ladybugFoot, this.size*(-1/9)-this.legOffsetX, -this.size/(6), this.size/3, this.size/3);
			image(ladybugFoot, this.size*(-1/9-1/4)+this.legOffsetX, -this.size/(5.5), this.size/3, this.size/3);
		} else{
			image(ladybugFoot, this.size*(-1/9+1/4)+this.legOffsetX, -this.size/(6), this.size/3, this.size/3);
			image(ladybugFoot, this.size*(-1/9)-this.legOffsetX, -this.size/(5.5), this.size/3, this.size/3);
			image(ladybugFoot, this.size*(-1/9-1/4)+this.legOffsetX, -this.size/(6), this.size/3, this.size/3);
		}
			
		image(ladybug, 0, -this.size/2-this.size/10, this.size, this.size);
		pop();
		pop();
	}
	return this;
}

var Plant = function(id, x, height, hasFlower, hasLeaf){
	this.id = id;
	this.x = x;
	this.height = height;
	this.hasFlower = hasFlower;
	this.flower = new Flower(x, -height);
	this.hasLeaf = hasLeaf; //important
	this.leaves = [];
	var numLeaves = (height-(height%75))/75;
	var doLeafFlip;
	if(this.id%2 == 1){
		doLeafFlip = false;
	} else{
		doLeafFlip = true;
	}
	for(let i = 0; i<numLeaves; i++){ //the client creates leaf placements
		if(!(doLeafFlip)){
			this.leaves[i]=new Leaf(x+50, -((i+0.5)*75), doLeafFlip);
		} else{
			this.leaves[i]=new Leaf(x-50, -((i+0.5)*75), doLeafFlip);
		}
		doLeafFlip = !doLeafFlip;
	}
	this.draw = function(){
		image(stem, this.x, -this.height/2, 150, this.height);
	}
	return this;
}

var Flower = function(x,y){
	this.x = x;
	this.y = y;

	this.size = 150;

	this.draw = function(){
		image(flowerWhite, this.x, this.y, this.size, this.size);
	}
	return this;
}

var Leaf = function(x, y, isFlipped){
	this.x = x;
	this.y = y;
	this.isFlipped = isFlipped;

	this.size = 100;

	this.draw = function(){
		push();
		translate(this.x, this.y);
		if(!(this.isFlipped)){
			scale(1, 1)
			image(leaf, 0, 0, this.size, this.size*3/4);

		} else{
			scale(-1, 1)
			image(leaf, 0, 0, this.size, this.size*3/4);
		}
		pop();
	}
	return this;
}



function keyPressed() {
	var sizeChange = 0;
	var speedChange = 0;
	var resetStats = false;
	
	var abilitySet;
	var abilityCardsActive = false;
	var abilityCards;
	for(let i in players) {
	    if(players[i].id === myId) {
	        abilitySet = players[i].abilitySet;
	        abilityCardsActive = players[i].abilityCardsActive;
	        abilityCards = players[i].abilityCards;
	    }
  	}
  	var abilityCard;
  	var whatAbility;


	if(key === "1"){
		if(1 <= abilitySet.length){
			whatAbility = 0; //antihack - use indices instead of ability
			socket.emit("usedAbility", {whatAbility});
		}
	}
	if(key === "2"){
		if(2 <= abilitySet.length){
			whatAbility = 1;
			socket.emit("usedAbility", {whatAbility});
		}
	}
	if(key === "3"){
		if(3 <= abilitySet.length){
			whatAbility = 2;
			socket.emit("usedAbility", {whatAbility});
		}
	}
	if(key === "4"){
		if(4 <= abilitySet.length){
			whatAbility = 3;
			socket.emit("usedAbility", {whatAbility});
		}
	}
	if(key === "5"){
		if(5 <= abilitySet.length){
			whatAbility = 4;
			socket.emit("usedAbility", {whatAbility});
		}
	}
	if(key === "6"){
		if(6 <= abilitySet.length){
			whatAbility = 5;
			socket.emit("usedAbility", {whatAbility});
		}
	}
	if(key === "7"){
		if(7 <= abilitySet.length){
			whatAbility = 6;
			socket.emit("usedAbility", {whatAbility});
		}
	}
	if(key === "8"){
		if(8 <= abilitySet.length){
			whatAbility = 7;
			socket.emit("usedAbility", {whatAbility});
		}
	}
	if(key === "9"){
		if(9 <= abilitySet.length){
			whatAbility = 8;
			socket.emit("usedAbility", {whatAbility});
		}
	}
}

function mouseClicked() {
  	var abilityCards;
  	var abilityCardsActive;
  	var abilitySet;
  	for(let i in players) {
    	if(players[i].id === myId) {
      		abilityCards = players[i].abilityCards;
      		abilitySet = players[i].abilitySet;
      		abilityCardsActive = players[i].abilityCardsActive;
		}
	}
	var abilityCard;
	var totalMenuWidth = ((abilityCards.length)*(windowHeight/7)) + ((abilityCards.length-1)*(windowHeight/55));
  
	if(abilityCardsActive){
    	for(let i in abilityCards){
     		if(((windowWidth*0.5-(totalMenuWidth/2) + i*(windowHeight/7)+(i)*(windowHeight/55))<mouseX && mouseX<(windowWidth*0.5-(totalMenuWidth/2) + i*(windowHeight/7)+(i)*(windowHeight/55) + windowHeight/7) && (windowHeight*0.4-windowHeight/14)<mouseY && mouseY<(windowHeight*0.4-windowHeight/14 + windowHeight/7))){
        		abilityCard = i;
        		socket.emit("choseCard", {abilityCard});
        		break;
      		}
    	}
  	}
}

function sendInputData() { //client specific p5 stuff that the server cant get
	var headAngle;

	for(let i in players) {
        if(players[i].id === myId) {
    		headAngle = atan2(mouseY-(height*0.75+players[i].size*-0.1), mouseX-(width/2)); //headAngle from head level
    	}
    }

	var distXToMouse = Math.abs(mouseX-(width/2));

	let isFlipped;
	if(mouseX>(width/2)){
		isFlipped = false;
	} else{
		isFlipped = true;
	}

	socket.emit("inputData", {mouseX, mouseY, headAngle, distXToMouse, isFlipped, windowWidth, windowHeight});
}
