
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

	HideUI = loadImage('assets/turtleHead.png');
	BoxRollUI = loadImage('assets/shellBox.png');
	DomeRollUI = loadImage('assets/shellDome.png');
	SpikeRollUI = loadImage('assets/shellSpike.png');
}

//first thing that is called. Sets up everything
function setup() {
    players = [];
    myId = 0;

    plants = [];

    socket = io();
    
    socket.emit("imReady", {name: "Boxt.io Player"}); //not actually used I dont think

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
            for(let j in players) {//gets the data from players as to render
                if(players[j].id === data.updatePack[i].id) {
                    players[j].x = data.updatePack[i].x;
                    players[j].y = data.updatePack[i].y;
                    players[j].progressXp = data.updatePack[i].progressXp;
                    players[j].xp = data.updatePack[i].xp;
                    players[j].targetXp = data.updatePack[i].targetXp;
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

    socket.on("plantUpdatePack", function(data) {
        for(let i in data.plantUpdatePack) {
            for(let j in plants) {
            	if(plants[j].id === data.plantUpdatePack[i].id) {
            		plants[j].hasFlower = data.plantUpdatePack[i].hasFlower;
            		plants[j].hasLeaf = data.plantUpdatePack[i].hasLeaf;
            		// console.log("updated flower state as "+plants[j].hasFlower)
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
        		adjustedX = ((width/2+players[i].size/3) - players[i].x);
        	} else{
        		adjustedX = ((width/2-players[i].size/3) - players[i].x);
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
    for(let i in players) {
        players[i].draw();
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
    text("LEADERBOARD", windowHeight*0.06, (windowHeight*0.045), windowHeight*0.25, windowHeight*0.03)
    textSize(15);
    for(let i in players){
    	if(players[i].id === myId){
      		fill(255, 255, 0);
      	}
      	text(i + " | " + players[i].name + " : " + Math.round(players[i].xp), windowHeight*0.05, (windowHeight*0.08)+(windowHeight*0.03)*i, windowHeight*0.25, windowHeight*0.03);
      	if(players[i].id === myId){
      		fill(0, 200, 0);
      	}
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
	this.progressXp = 0;
	this.targetXp = 10;
	this.upgrade = 1;
	this.isFlipped = false;
	this.headAngle = 0;

	this.xp = 0;

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
		default:
			console.log("ability image not found");
			img = flowerWhite;
			break;
    	}
    	return img;
	}

	this.drawUI = function(){
		var adjustedY = ((height*0.75+this.size/3.5) - this.y);
		var percentage = this.progressXp/this.targetXp;
		
		fill(0, 100, 0);
    	rect(windowWidth * 0.05, windowHeight*0.85, windowWidth*0.2, windowWidth*0.03, 20)
    	fill(0, 250, 0);
    	rect(windowWidth * 0.05, windowHeight*0.85, windowWidth*0.2*percentage, windowWidth*0.03, 20)

      
     	var c = 0; //we need to render ui positions forwards
    	for (let i = this.abilitySet.length - 1; i >= 0; i--) {
    		fill(0, 50, 0);
    		rect(windowWidth*0.95-(c*windowWidth/15+c*windowWidth/225)-windowWidth/15, windowHeight*0.85+windowHeight*0.025-windowWidth/30,windowWidth/15,windowWidth/15, 5);

    		//we read ability list backwards
    		var tileImg;
    		tileImg = this.getAbilityImg(this.abilitySet[i]);
    		
    		image(tileImg, windowWidth*0.95-(c*windowWidth/15+c*windowWidth/225)-windowWidth/15+windowWidth/(15*2), //x
            	windowHeight*0.85+windowHeight*0.025-windowWidth/30+windowWidth/(15*2),windowWidth/15,windowWidth/15); //y, width height
        	c++;
        }

        if(this.abilityCardsActive){
        	var totalMenuWidth = ((this.abilityCards.length-1)*(windowWidth/15)) + ((this.abilityCards.length-2)*(windowWidth/225))
      		for(let i in this.abilityCards){
      			fill(0, 50, 0);
    			rect(windowWidth*0.5-(totalMenuWidth/2) + i*(windowWidth/15+windowWidth/225) - windowWidth/30, 
    				windowHeight*0.4-windowWidth/30,windowWidth/15,windowWidth/15, 5);
      			
      			var cardImg;
      			cardImg = this.getAbilityImg(this.abilityCards[i]);

      			image(cardImg, windowWidth*0.5-(totalMenuWidth/2) + i*(windowWidth/15+windowWidth/225), //x
            		windowHeight*0.4,windowWidth/15,windowWidth/15); //y, width height

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
		if(!(this.isFlipped)){
			scale(1, 1)
		} else{
			scale(-1, 1)
		}
		if(!(this.doingAbility && ((this.whatAbility === "BoxRoll" || this.whatAbility === "DomeRoll" || this.whatAbility === "SpikeRoll") || this.whatAbility === "Hide"))){
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
				translate(0,0+(this.size*0.4));
				rotate(this.bodyAngle);
				image(shellImg, 0, 0, this.size, this.size);
			} else if(this.whatAbility === "Hide"){
				translate(0,0+(this.size/6));
				image(shellImg, 0, 0, this.size, this.size);
			}
		} else{
			image(shellImg, 0, 0, this.size, this.size);
		}
		// if(!(this.isFlipped)){
		// 	scale(-1, 1)
		// } else{
		// 	scale(1, 1)
		// }
		// scale(-1, 1)
		// text(this.name, 0, 0, 100, 100);
		pop();
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
        	abilitySet = players[i].abilitySet
        	abilityCardsActive = players[i].abilityCardsActive
        	abilityCards = players[i].abilityCards
        }
    }
	var whatAbility;
	
	// if(key === "w"){ //testing
	// 	xpChange = 10;
	// 	console.log("xp up");
	// }
	// if(key === "s"){
	// 	console.log("xp down");
	// }
	// if(key === "q"){
	// 	speedChange = -1
	// }
	// if(key === "e"){
	// 	speedChange = 1
	// }

	// if(key === "w" || key === "s" || key === "q" || key === "e"){
	// 	socket.emit("commandData", {xpChange, speedChange});
	// }

	if(abilityCardsActive){ //choose card
		if(key === "1"){
			if(1 <= abilityCards.length){
				abilityCard = abilityCards[0];
				socket.emit("choseCard", {abilityCard});
			}	
		}
		if(key === "2"){
			if(2 <= abilityCards.length){
				abilityCard = abilityCards[1];
				socket.emit("choseCard", {abilityCard});
			}
		}
		if(key === "3"){
			if(3 <= abilityCards.length){
				abilityCard = abilityCards[2];
				socket.emit("choseCard", {abilityCard});
			}
		}
		if(key === "4"){
			if(4 <= abilityCards.length){
				abilityCard = abilityCards[3];
				socket.emit("choseCard", {abilityCard});
			}
		}
		if(key === "5"){
			if(5 <= abilityCards.length){
				abilityCard = abilityCards[4];
				socket.emit("choseCard", {abilityCard});
			}
		}
	} else{ //use ability
		if(key === "1"){
			if(1 <= abilitySet.length){
				whatAbility = abilitySet[0];
				socket.emit("usedAbility", {whatAbility});
			}
		}
		if(key === "2"){
			if(2 <= abilitySet.length){
				whatAbility = abilitySet[1];
				socket.emit("usedAbility", {whatAbility});
			}
		}
		if(key === "3"){
			if(3 <= abilitySet.length){
				whatAbility = abilitySet[2];
				socket.emit("usedAbility", {whatAbility});
			}
		}
		if(key === "4"){
			if(4 <= abilitySet.length){
				whatAbility = abilitySet[3];
				socket.emit("usedAbility", {whatAbility});
			}
		}
		if(key === "5"){
			if(5 <= abilitySet.length){
				whatAbility = abilitySet[4];
				socket.emit("usedAbility", {whatAbility});
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
