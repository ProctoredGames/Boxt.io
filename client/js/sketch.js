var socket;
var myPlayer;
var my_id;

var chatConsole = document.getElementById("chatConsole");

//leg has a total range of 20% of the turtle
var upperLegBound = 0.025;
var lowerLegBound = -0.075;

var mouseStopDist = 0.8;


//preload, setup, and draw are called by p5.js

var shellBox, shellDome, shellSpike;
var turtle, turtleHead, turtleJaw, turtleFoot, turtleTail;
var stem, leaf, flowerWhite, flowerYellow;
var hideUI, boxRollUI, domeRollUI, spikeRollUI;

var crackImg;

//needs to be changed in BOTH the server and client
var biomeSize = 6000;

//loads assets on start of game
function preload(){
	shellBoxImg = loadImage('assets/shellBox.png');
	shellDomeImg = loadImage('assets/shellDome.png');
	shellSpikeImg = loadImage('assets/shellSpike.png');
	shellPorcupineImg = loadImage('assets/shellPorcupine.png');
	// turtle = loadImage('assets/turtle.png');
	turtleHeadImg = loadImage('assets/turtleHead.png');
	// turtleJaw = loadImage('assets/turtle.png');
	turtleFootImg = loadImage('assets/turtleFoot.png');
	// turtleTail = loadImage('assets/turtle.png');
	stemImg = loadImage('assets/stem.png');
	grassPatchImg = loadImage('assets/grass.png');
	leafImg = loadImage('assets/leaf.png');
	flowerWhiteImg = loadImage('assets/flowerWhite.png');
	flowerYellowImg = loadImage('assets/flowerYellow.png');

	hideUIImg = loadImage('assets/UI/hideUI.png');
	boxRollUIImg = loadImage('assets/UI/boxRollUI.png');
	domeRollUIImg = loadImage('assets/UI/domeRollUI.png');
	spikeRollUIImg = loadImage('assets/UI/spikeRollUI.png');
	porcupineUIImg = loadImage('assets/shellPorcupine.png');

	ladybugImg = loadImage('assets/ladybug.png');
	ladybugFootImg = loadImage('assets/ladybugFoot.png');

	antImg = loadImage('assets/ant.png');
	antFootImg = loadImage('assets/antFoot.png');

	spiderImg = loadImage('assets/spider.png');
	spiderFootImg = loadImage('assets/spiderFoot.png');

	crownImg = loadImage('assets/crown.png');
	crackImg = loadImage('assets/cracks.png');
	title = loadImage('assets/title.png');
}


//first thing that is called. Sets up everything
function setup() {
	players = [];
	my_id = 0;

	grass = [];

	flowers = [];

	ladybugs = [];

	ants = [];
  
	spiders = [];

	isSpectating = true;
	spectateX = Math.random()*(biomeSize*3);
	spectateY = 0;
	spectateDir = 1;
	spectateSpeed = 0.5;
	
	typingChat = false;

	xCam = 0
	xCamSpeed = 0.2
	xCamMax = 0.6

	socket = io();
	
	playerChat = "";

	playerName = "boxt.io";

	socket.emit("loadedPage", {name: null});

	socket.on("yourId", function(data) {
		my_id = data.id;
	});

	//this instance of client (this player) joining. (Only run once)
	socket.on("newPlayer", function(data) {
		var player = new Player(data.id, data.name, data.x, data.y, data.size, data.isDeveloper);
		players.push(player);
		//console.log("new player");
	});

	socket.on("initPack", function(data) {
		for(let i in data.initPack) {
			var player = new Player(data.initPack[i].id, data.initPack[i].name, data.initPack[i].x, data.initPack[i].y, data.initPack[i].size, data.initPack[i].isDeveloper);
			players.push(player);
			console.log("player init with: "+my_id);
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
					players[j].abilityCards = data.updatePack[i].abilityCards;
					players[j].abilityChoicesActive = data.updatePack[i].abilityChoicesActive;
					players[j].abilityChoices = data.updatePack[i].abilityChoices;
					players[j].cooldownLength = data.updatePack[i].cooldownLength;
					players[j].cooldownSet = data.updatePack[i].cooldownSet;
				}
			}
		}
	});

	socket.on("flowerInitPack", function(data) {
		for(let i in data.flowerInitPack) {
			var flower = new Flower(data.flowerInitPack[i].id, data.flowerInitPack[i].x, data.flowerInitPack[i].height,data.flowerInitPack[i].hasFlowerHead, data.flowerInitPack[i].hasLeaf, data.flowerInitPack[i].flowerHeadColor);
			flowers.push(flower);
			//console.log("flower init");
		}
	});

	socket.on("grassInitPack", function(data) {
		for(let i in data.grassInitPack) {
			var patch = new Grass(data.grassInitPack[i].id, data.grassInitPack[i].x, data.grassInitPack[i].size);
			grass.push(patch);
			//console.log("grass init");
		}
	});

	socket.on("ladybugInitPack", function(data) {
		for(let i in data.ladybugInitPack) {
			var ladybug = new Ladybug(data.ladybugInitPack[i].id, data.ladybugInitPack[i].x, data.ladybugInitPack[i].y, data.ladybugInitPack[i].size);
			ladybugs.push(ladybug);
			//console.log("New ladybug");
		}
	});
	
	socket.on("antInitPack", function(data) {
		for(let i in data.antInitPack) {
			var ant = new Ant(data.antInitPack[i].id, data.antInitPack[i].x, data.antInitPack[i].y, data.antInitPack[i].size);
			ants.push(ant);
			//console.log("New ant");
		}
	});

	socket.on("spiderInitPack", function(data) {
		for(let i in data.spiderInitPack) {
			var spider = new Spider(data.spiderInitPack[i].id, data.spiderInitPack[i].x, data.spiderInitPack[i].y, data.spiderInitPack[i].size);
			spiders.push(spider);
			//console.log("New spider");
		}
	});
  
	socket.on("getChat", function(data){
	  for(let i in players) {
		if(players[i].id === data.messagePack.id){
		  players[i].message = data.messagePack.message
		  // alert(data.messagePack.message)
		}
	  }
	});

	socket.on("flowerUpdatePack", function(data) {
		for(let i in data.flowerUpdatePack) {
			for(let j in flowers) {
				if(flowers[j].id === data.flowerUpdatePack[i].id) {
					flowers[j].hasFlowerHead = data.flowerUpdatePack[i].hasFlowerHead;
					flowers[j].hasLeaf = data.flowerUpdatePack[i].hasLeaf;
					flowers[j].flowerHeadColor = data.flowerUpdatePack[i].flowerHeadColor;
				// flowers[j].leaves = data.flowerUpdatePack[i].leaves;
					// console.log("updated flower state as "+flowers[j].hasFlowerHead)
				}
			}
		}
	});

	socket.on("ladybugUpdatePack", function(data) {
		for(let i in data.ladybugUpdatePack) {
			for(let j in ladybugs) {
				if(ladybugs[j].id === data.ladybugUpdatePack[i].id) {
					ladybugs[j].x = data.ladybugUpdatePack[i].x;
					ladybugs[j].y = data.ladybugUpdatePack[i].y;
					ladybugs[j].size = data.ladybugUpdatePack[i].size;
					ladybugs[j].frontLegUp = data.ladybugUpdatePack[i].frontLegUp;
					ladybugs[j].isFlipped = data.ladybugUpdatePack[i].isFlipped;
					ladybugs[j].legOffsetX = data.ladybugUpdatePack[i].legOffsetX;
					ladybugs[j].legOffsetY = data.ladybugUpdatePack[i].legOffsetY;
					ladybugs[j].maxHP = data.ladybugUpdatePack[i].maxHP;
					ladybugs[j].HP = data.ladybugUpdatePack[i].HP;
				}
			}
		}
	});

	socket.on("antUpdatePack", function(data) {
		for(let i in data.antUpdatePack) {
			for(let j in ants) {
				if(ants[j].id === data.antUpdatePack[i].id) {
					ants[j].x = data.antUpdatePack[i].x;
					ants[j].y = data.antUpdatePack[i].y;
					ants[j].size = data.antUpdatePack[i].size;
					ants[j].frontLegUp = data.antUpdatePack[i].frontLegUp;
					ants[j].isFlipped = data.antUpdatePack[i].isFlipped;
					ants[j].legOffsetX = data.antUpdatePack[i].legOffsetX;
					ants[j].legOffsetY = data.antUpdatePack[i].legOffsetY;
					ants[j].maxHP = data.antUpdatePack[i].maxHP;
					ants[j].HP = data.antUpdatePack[i].HP;
				}
			}
		}
	});

	socket.on("spiderUpdatePack", function(data) {
		for(let i in data.spiderUpdatePack) {
			for(let j in spiders) {
				if(spiders[j].id === data.spiderUpdatePack[i].id) {
					spiders[j].x = data.spiderUpdatePack[i].x;
					spiders[j].y = data.spiderUpdatePack[i].y;
					spiders[j].size = data.spiderUpdatePack[i].size;
					spiders[j].frontLegUp = data.spiderUpdatePack[i].frontLegUp;
					spiders[j].isFlipped = data.spiderUpdatePack[i].isFlipped;
					spiders[j].legOffsetX = data.spiderUpdatePack[i].legOffsetX;
					spiders[j].legOffsetY = data.spiderUpdatePack[i].legOffsetY;
					spiders[j].maxHP = data.spiderUpdatePack[i].maxHP;
					spiders[j].HP = data.spiderUpdatePack[i].HP;
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
	nameInp = createInput("");
	centerNameInput();
	nameInp.input(setName);
	nameInp.elt.focus();
	nameInp.style('text-align', 'center');
	nameInp.style('font-size', '30');
	button = createButton('PLAY');
	centerButton();
	button.mousePressed(startGame);
	button.style('font-size', '30');
}

function startGame(){
	removeElements();
	isSpectating = false
	players = []
	grass = []
	flowers = []
	ladybugs = []
	socket.emit("imReady", {name: playerName});
	// chatInp = createInput("");
	// centerInput();
	// chatInp.input(setName);
}

function setName(){
	playerName = this.value()
  	if (playerName.length > 12) {
		playerName = playerName.substring(0, 12); // Truncate input if it exceeds the limit
	}
}

function setChat(){
  playerChat = this.value()
  if (playerChat.length > 30) {
	playerChat = playerChat.substring(0, 30); // Truncate input if it exceeds the limit
  }
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	if(isSpectating){
		centerNameInput()
		centerButton()
	} else{
	  if(typingChat){
		centerChatInput()
	  }
	}
}

function centerNameInput() {
	let titleWidth = windowHeight/5 * (1300/300)
	nameInp.position(windowWidth/2-(titleWidth/2)/2, windowHeight/2 - (windowHeight*0.08));
	nameInp.size(titleWidth/2, windowHeight/15)
}

function centerChatInput() {
	let titleWidth = windowHeight/5 * (1300/300)
	chatInp.position(windowWidth/2-(titleWidth/2)/2, windowHeight*0.9 - (windowHeight*0.08));
	chatInp.size(titleWidth/2, windowHeight/15)
}

function centerButton() {
	let titleWidth = windowHeight/5 * (1300/300)
	button.position(windowWidth/2-(titleWidth/4)/2, windowHeight/2);
	button.size(titleWidth/4, windowHeight/14);
}

function quickSort(items) {
	if (items.length > 1) {
		let pivot = items[0];
		let left = [];
		let right = [];
		for (let i = 1; i < items.length; i++) {
			if(items[i].XP > pivot.XP) {
				left.push(items[i]);
			}else {
				right.push(items[i]);
			}
		}
		return quickSort(left).concat(pivot, quickSort(right));
	}else {
		return items;
	}
}

//called every frame
function draw(){
	// scale(0.2);
	background(0, 0, 250); // it gets a hex/rgb color
	strokeWeight(0); //no black outlines
	sendInputData();
	push(); //starts using player POV in world
	if(!(isSpectating)){
		for(let i in players) {
			if(players[i].id === my_id) {
				var adjustedX;
				if(players[i].isFlipped){
					if(xCam> -xCamMax){
						xCam -= xCamSpeed
						if(xCam<-xCamMax){
							xCam = -xCamMax
						}
					}
				} else{
					if(xCam< xCamMax){
						xCam += xCamSpeed
						if(xCam>xCamMax){
							xCam = xCamMax
						}
					}
				}
				adjustedX = ((width/2-players[i].size*xCam)- players[i].x);
				var adjustedY = ((height*0.75+players[i].size/3.5) - players[i].y);
				translate(adjustedX, adjustedY); //zooming in to 1/3 up the player
			}
		}
	} else{
		adjustedX = ((width/2)-spectateX)
		adjustedY = ((height*0.75+240/3.5)-spectateY)
		spectateX += spectateSpeed*spectateDir
		if(spectateX>biomeSize*3){
			spectateX = biomeSize*3
			spectateDir = -1
		}
		if(spectateX<0){
			spectateX = 0
			spectateDir = 1
		}
		translate(adjustedX, adjustedY);
	}
	  
	//desert
	fill(0, 0, 220);
	rect(0, 0-adjustedY, biomeSize, windowHeight);
	fill(231, 183, 68);
	rect(0, 0, biomeSize, windowHeight-adjustedY);

	//plains
	fill(0, 0, 180);
	rect(biomeSize, 0-adjustedY, biomeSize, windowHeight);
	fill(0,150,0);
	rect(biomeSize, 0, biomeSize, windowHeight-adjustedY);

	//jungle
	fill(0, 0, 200);
	rect(biomeSize+biomeSize, 0-adjustedY, biomeSize, windowHeight);
	fill(0,120,0);
	rect(biomeSize+biomeSize, 0, biomeSize, windowHeight-adjustedY);


	for (let i = 0; i<((biomeSize*3)/150); i++){
		if(i*150<biomeSize){
			fill(0, 0, 190);
		} else if(i*150<biomeSize*2){
			fill(0, 0, 150);
		} else if(i*150<biomeSize*3){
			fill(0, 0, 170);
		}
		rect((i*150)-5,0-adjustedY,10,adjustedY)
	}

	for (let b = 0; b<3; b++){
		for (let i = 0; i<=((adjustedY)/150); i++){
			if(i == 0){
				if(b == 0){
					fill(231, 153, 68);
				} else if(b == 1){
					fill(0, 120, 0)
				} else if(b == 2){
					fill(0, 90, 0)
				}
			} else{
				if(b == 0){
					fill(0, 0, 190)
				} else if(b == 1){
					fill(0, 0, 150)
				} else if(b == 2){
					fill(0, 0, 170)
				}
			}		
			rect(b*biomeSize,0-(i*150)-5,biomeSize,10)
		}
	}

	for(let i in grass) {
		grass[i].draw();
	}

	var rankedFlowers = quickSort(flowers);

	for(let i in rankedFlowers) {
		flowers[i].draw();
		for(let j in flowers[i].leaves){
			if(flowers[i].hasLeaf[j]){
				flowers[i].leaves[j].draw();
			}
		}
	}

	for(let i in rankedFlowers) {
		if(flowers[i].hasFlowerHead){
			flowers[i].flowerHead.draw();
			//console.log("Flower Drawn!");
		}
	}
  
	var rankedPlayers = quickSort(players);

	for(let i in rankedPlayers) {
		rankedPlayers[i].draw();
		rankedPlayers[i].drawName();
	}

	var rankedLadybugs = quickSort(ladybugs);

	for(let i in rankedLadybugs) {
		ladybugs[i].draw();
		if(ladybugs[i].HP != ladybugs[i].maxHP){
			ladybugs[i].drawStatus();
		}
	}

	var rankedAnts = quickSort(ants);

	for(let i in rankedAnts) {
		ants[i].draw();
		if(ants[i].HP != ants[i].maxHP){
			ants[i].drawStatus();
		}
	}

	var rankedSpiders = quickSort(spiders);

	for(let i in rankedSpiders) {
		spiders[i].draw();
		if(spiders[i].HP != spiders[i].maxHP){
			spiders[i].drawStatus();
		}
	}

	for(let i in rankedPlayers) {
		rankedPlayers[i].drawMessage();
	}

	pop(); //stops using player POV in world


	if(!isSpectating){
		for(let i in players){
			if(players[i].id == my_id){
				drawUI(i)
			}
		}
	} else{
		drawChangelog()
		image(title, windowWidth/2, windowHeight/2-(windowHeight*0.2), windowHeight/5 * (1300/300), windowHeight/5);
	}
}

function drawChangelog(){
	fill(0,0,0,200);
	rect(windowHeight*0.03, windowHeight*0.03, windowHeight*0.3, windowHeight*0.35, 20);
	fill(200, 200, 0);
	textSize(25);
	textAlign(CENTER);
	text("April 3", windowHeight*0.05, (windowHeight*0.055), windowHeight*0.25, windowHeight*0.03)
	fill(0, 200, 0);
	textSize(17);
	textAlign(LEFT);
	textWrap(WORD);
	text("• Added Porcupine as a shell upgrade in desert! \n • Increased base turtle speed! \n • Fixed collisions! \n • Optimised and improved the game's code a lot \n • New big updates are in the works...", windowHeight*0.05, 
			(windowHeight*0.10), windowHeight*0.28, windowHeight);

}

function drawLeaderboard(thisIndex){
	fill(0,0,0,200);
	rect(windowHeight*0.03, windowHeight*0.03, windowHeight*0.3, windowHeight*0.35, 20);
	fill(200, 200, 0);
	textSize(20);
	textAlign(CENTER);
	text("LEADERBOARD", windowHeight*0.055, (windowHeight*0.06), windowHeight*0.25, windowHeight*0.03)
	textSize(17);
	textAlign(LEFT);

	var rankedPlayers = quickSort(players);

	var count = 1;
	for(let i in rankedPlayers){
		if(rankedPlayers[i].id === my_id){
			fill(255, 255, 0);
		}
		text(count + " | " + rankedPlayers[i].name + " : " + Math.round(rankedPlayers[i].XP), windowHeight*0.05, 
			(windowHeight*0.1)+(windowHeight*0.03)*i, windowHeight*0.28, windowHeight*0.03);
		if(rankedPlayers[i].id === my_id){
			fill(0, 200, 0);
		}
		if(count === 8){
			break;
		}
		count ++;
	}
}

function drawMinimap(thisIndex){
	push()

	translate(windowWidth-(biomeSize/50+biomeSize/50+biomeSize/50)-windowHeight*0.04, windowHeight*0.04)

	//background
	fill(0,0,0,200);
	rect(0-10, 0-10, (biomeSize*3)/50+(10*2), 130+(10*2), 15);

	//desert
	fill(0, 0, 220);
	rect(0, 0, biomeSize/50, 100, 15);
	rect(biomeSize/(50*2), 0, biomeSize/(50*2), 100);
	fill(231, 183, 68);
	rect(0, 80, biomeSize/50, 20, 15);
	rect(0, 80, biomeSize/(50), 20/2);
	rect(0+biomeSize/(50*2), 80, biomeSize/(50*2), 20);

	//plains
	fill(0, 0, 180);
	rect(biomeSize/50, 0, biomeSize/50, 100);
	fill(0,150,0);
	rect(biomeSize/50, 80, biomeSize/50, 20);

	//jungle
	fill(0, 0, 200);
	rect(biomeSize/50+biomeSize/50, 0, biomeSize/50, 100, 15);
	rect(biomeSize/50+biomeSize/50, 0, biomeSize/(50*2), 100);
	fill(0,120,0);
	rect(biomeSize/50+biomeSize/50, 80, biomeSize/50, 20, 15);
	rect(biomeSize/50+biomeSize/50, 80, biomeSize/(50), 20/2);
	rect(biomeSize/50+biomeSize/50, 80, biomeSize/(50*2), 20);


	var rankedPlayers = quickSort(players);

	if(players[thisIndex].id === rankedPlayers[0].id){
		image(crownImg, players[thisIndex].x/50, 72.5, 20, 20)
	} else{
		fill(255,255,255);
		circle(players[thisIndex].x/50, 75, 15)
		image(crownImg, rankedPlayers[0].x/50, 72.5, 20, 20)
	}

	fill(0, 200, 0);

	text("Version 4.03.24", windowHeight*0.025, 112, windowHeight*0.25, windowHeight*0.03)

	pop()

}

function drawStatusBars(thisIndex){
	var percentage = players[thisIndex].progressXP/players[thisIndex].targetXP;
	if(percentage > 1.00){//bar cant display over 100%
		percentage = 1.00
	}
		
	fill(0, 100, 0);
	rect(windowWidth * 0.05, windowHeight*0.85, windowWidth*0.2, windowHeight*0.08, 20)
	fill(0, 250, 0);
	rect(windowWidth * 0.05, windowHeight*0.85, windowWidth*0.2*percentage, windowHeight*0.08, 20)
		
	percentage = players[thisIndex].HP/players[thisIndex].maxHP;
	if(percentage > 1.00){//bar cant display over 100%
		percentage = 1.00
	}
	
	fill(0, 100, 0);
	rect(windowWidth * 0.05, windowHeight*0.75, windowWidth*0.125, windowHeight*0.08, 20)
	fill(255, 255, 255);
	rect(windowWidth * 0.05, windowHeight*0.75, windowWidth*0.125*percentage, windowHeight*0.08, 20)
}

function drawNewAbilityChoices(thisIndex){
	if(players[thisIndex].abilityChoicesActive){
		var totalMenuWidth = ((players[thisIndex].abilityChoices.length)*(windowHeight/7)) + 
			((players[thisIndex].abilityChoices.length-1)*(windowHeight/55));
		for(let i in players[thisIndex].abilityChoices){
			if(players[thisIndex].abilityChoices[i] == "porcupine"){
				fill(115, 90, 35, 200);
			} else{
				fill(0, 50, 0, 200);
			}
			rect(windowWidth*0.5-(totalMenuWidth/2) + i*(windowHeight/7)+(i)*(windowHeight/55), 
				windowHeight*0.4-windowHeight/14,windowHeight/7,windowHeight/7, 10);

			var cardImg;
			cardImg = players[thisIndex].getAbilityImg(players[thisIndex].abilityChoices[i]);

			image(cardImg, windowWidth*0.5-(totalMenuWidth/2) + i*(windowHeight/7)+(i)*(windowHeight/55) + windowHeight/14, //x
				windowHeight*0.4,windowHeight/7,windowHeight/7); //y, width height

			fill(0, 255, 0);
			textSize(windowHeight/(7*6));
			textAlign(CENTER);
			text(players[thisIndex].getAbilityName(players[thisIndex].abilityChoices[i]), windowWidth*0.5-(totalMenuWidth/2) + 
				i*(windowHeight/7)+(i)*(windowHeight/55) + windowHeight/14, windowHeight*0.4 + windowHeight/18);
		}
	}
}

function drawMyabilityChoices(thisIndex){
	//weird rendering for right to left card layout
	var c = 0; //we need to render ui positions forwards
	for (let i = players[thisIndex].abilityCards.length - 1; i >= 0; i--) { //we read ability list backwards
		if(players[thisIndex].abilityCards[i] == "porcupine"){
			fill(115, 90, 35, 200);
		} else{
			fill(0, 50, 0, 200);
		}
		rect(windowWidth*0.95-(c*windowWidth/15+c*windowWidth/225)-windowWidth/15, 
			windowHeight*0.85-windowWidth/30,windowWidth/15,windowWidth/15, 10);

		var tileImg;
		tileImg = players[thisIndex].getAbilityImg(players[thisIndex].abilityCards[i]);

		image(tileImg, windowWidth*0.95-(c*windowWidth/15+c*windowWidth/225)-windowWidth/15+windowWidth/(15*2), //x
			windowHeight*0.85,windowWidth/15,windowWidth/15); //y, width height

		fill(0, 255, 0);
		textSize(windowWidth/(15*6));
		textAlign(CENTER);
		text(players[thisIndex].getAbilityName(players[thisIndex].abilityCards[i]), windowWidth*0.95-(c*windowWidth/15+
			c*windowWidth/225)-windowWidth/15+windowWidth/(15*2), 
		windowHeight*0.85 + windowWidth/40);

		if(players[thisIndex].cooldownSet[i] != 0){
			fill(0, 0, 0, 100);
			rect(windowWidth*0.95-(c*windowWidth/15+c*windowWidth/225)-windowWidth/15,windowHeight*0.85-windowWidth/30,
				(windowWidth/15)*(players[thisIndex].cooldownSet[i]/players[thisIndex].cooldownLength[i]),windowWidth/15, 10);
		}
		c++;
	}
}

function drawUI(index){
	drawLeaderboard(index)
	drawMinimap(index)
	drawStatusBars(index)
	drawNewAbilityChoices(index)
	drawMyabilityChoices(index)
}

var Player = function(id, name, x, y, size, isDeveloper){
	this.id = id;
	this.name = name;
	this.isDeveloper = isDeveloper
	this.x = x;
	this.y = y;
	this.size = size;
	this.progressXP = 0;
	this.targetXP = 10;
	this.upgrade = 1;
	this.isFlipped = false;
	this.headAngle = 0;
  
	this.message = "";

	this.XP = 0;

	this.HP = 0;
	this.maxHP = 0;

	this.doingAbility = false;
	this.abilityCards = [];
	this.cooldownLength = [];
	this.cooldownSet = [];
	this.whatAbility;
	this.bodyAngle = 0;

	this.abilityChoicesActive = true;
	this.abilityChoices = [];

	this.doMovement = true;
	this.frontLegUp = true;
	this.legOffsetX = 0;
	this.shellType = "Box";

	this.getShellImg = function(shellType){
		var shellImg
		switch(shellType){
		case "Box":
			shellImg = shellBoxImg;
			break;
		case "Dome":
			shellImg = shellDomeImg;
			break;
		case "Spike":
			shellImg = shellSpikeImg;
			break;
		case "Porcupine":
			shellImg = shellPorcupineImg;
			break;
		default:
			console.log("shell not found");
			break;
		}
		return shellImg
	}

	this.getAbilityImg = function(abilityName){
		var img;
		switch(abilityName){
		case "hide":
			img = this.getShellImg(this.shellType);
			break;
		case "porcupine":
			img = porcupineUIImg;
			break;
		case "boxRoll":
			img = boxRollUIImg;
			break;
		case "domeRoll":
			img = domeRollUIImg;
			break;
		case "spikeRoll":
			img = spikeRollUIImg;
			break;
		case "stomp":
			img = turtleFootImg;
			break;
		case "ERROR"://testing
			img = flowerYellowImg;
			break;
		default:
			//console.log("ability image not found");
			img = flowerWhiteImg;
			break;
		}
		return img;
	}

	this.getAbilityName = function(abilityName){
		var dispName;
		switch(abilityName){
		case "hide":
			dispName = "Hide"
			break;
		case "porcupine":
			dispName = "Porcupine"
			break;
		case "boxRoll":
			dispName = "Box Roll"
			break;
		case "domeRoll":
			dispName = "Dome Roll!"
			break;
		case "spikeRoll":
			dispName = "Spike Roll!"
			break;
		case "stomp":
			dispName = "Stomp"
			break;
		case "jumpStomp":
			dispName = "Jump Stomp!"
			break;
		case "shockwave":
			dispName = "Shockwave!"
			break;
		case "dash":
			dispName = "Dash"
			break;
		case "charge":
			dispName = "Charge!"
			break;
		default:
			//console.log("ability image not found");
			dispName = abilityName
			break;
		}
		return dispName;
	}

	this.drawName = function(){
		push();
		translate(this.x, this.y);
		if(this.isDeveloper){
			fill(160,32,240);
		} else{
			fill(0, 0, 0);
		}
		textSize(26);
		textAlign(CENTER);
		text(this.name, 0, -this.size*1-this.size * 0.15);
		pop();
	}

	this.drawMessage = function(){
		push();
		translate(this.x, this.y);
		fill(255, 255, 0);
		textSize(24);
		textAlign(CENTER);
		if(!(this.doingAbility && (this.whatAbility === "hide" || this.whatAbility === "porcupine" || this.whatAbility === "boxRoll" || this.whatAbility === "domeRoll" || this.whatAbility === "spikeRoll"))){
			if(this.isFlipped){
				text(this.message, -this.size*0.6, -this.size*0.65);
			} else{
				text(this.message, this.size*0.6, -this.size*0.65);
			}
		} else{
			if(this.isFlipped){
				text(this.message, 0, -this.size*0.65);
			} else{
				text(this.message, 0, -this.size*0.65);
			}
		}
		pop();
	}


	this.draw = function(){
		var shellImg;

		shellImg = this.getShellImg(this.shellType)

		push();
		translate(this.x, this.y);
		push();
		if(!(this.isFlipped)){
			scale(1, 1)
		} else{
			scale(-1, 1)
		}
		if(!(this.doingAbility && ((this.whatAbility === "boxRoll" || this.whatAbility === "domeRoll" || this.whatAbility === "spikeRoll") || this.whatAbility === "hide" || this.whatAbility === "porcupine"))){
			if(this.doingAbility && (this.whatAbility === "stomp" || this.whatAbility === "shockwave")){
				if(this.frontLegUp){
					image(turtleFootImg, this.size/4 +this.legOffsetX, -(this.size/4), this.size/3, this.size/3); //front (1)
					image(turtleFootImg, -this.size/4-this.legOffsetX, -(this.size/6), this.size/3, this.size/3); //back (0)
				} else{
					image(turtleFootImg, this.size/4 +this.legOffsetX, -(this.size/6), this.size/3, this.size/3); //front (1)
					image(turtleFootImg, -this.size/4-this.legOffsetX, -(this.size/5.5), this.size/3, this.size/3); //back (0)
				}
			} else{
				if(this.doMovement){
					if(this.frontLegUp){
						image(turtleFootImg, this.size/4 +this.legOffsetX, -(this.size/5.5), this.size/3, this.size/3); //front (1)
						image(turtleFootImg, -this.size/4-this.legOffsetX, -(this.size/6), this.size/3, this.size/3); //back (0)
					} else{
						image(turtleFootImg, this.size/4 +this.legOffsetX, -(this.size/6), this.size/3, this.size/3); //front (1)
						image(turtleFootImg, -this.size/4-this.legOffsetX, -(this.size/5.5), this.size/3, this.size/3); //back (0)
					}
				} else{
					image(turtleFootImg, this.size/4 +this.legOffsetX, -(this.size/6), this.size/3, this.size/3); //front (1)
					image(turtleFootImg, -this.size/4-this.legOffsetX, -(this.size/6), this.size/3, this.size/3); //back (0)
				}
			}

			push();
			translate(this.size*0.55, -(this.size*0.35));
			if(!(this.isFlipped)){
				rotate(this.headAngle)
			} else{
				rotate(Math.PI-this.headAngle)
			}
			image(turtleHeadImg, this.size*0.05, -(this.size*0.05), this.size*(120/300), this.size/3);
			pop();
		}
		push();
		translate(0, -(this.size/2)-(this.size/6));
		if(this.doingAbility){
			if(this.whatAbility === "boxRoll" || this.whatAbility === "domeRoll" || this.whatAbility === "spikeRoll"){
				translate(0,0+(this.size*0.3));
				rotate(this.bodyAngle);
				image(shellImg, 0, -this.size*0.05, this.size, this.size);
			} else if(this.whatAbility === "hide" || this.whatAbility === "porcupine"){
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

var Ladybug = function(id, x, y, size){
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
		rect(-this.size/2, -this.size * 1.00, this.size, this.size * 0.20, 10)
		fill(0, 250, 0);
		rect(-this.size/2, -this.size * 1.00, this.size*percentage, this.size * 0.20, 10);
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
			image(ladybugFootImg, this.size*(-1/9+1/4)+this.legOffsetX, -this.size/(5.5), this.size/3, this.size/3);
			image(ladybugFootImg, this.size*(-1/9)-this.legOffsetX, -this.size/(6), this.size/3, this.size/3);
			image(ladybugFootImg, this.size*(-1/9-1/4)+this.legOffsetX, -this.size/(5.5), this.size/3, this.size/3);
		} else{
			image(ladybugFootImg, this.size*(-1/9+1/4)+this.legOffsetX, -this.size/(6), this.size/3, this.size/3);
			image(ladybugFootImg, this.size*(-1/9)-this.legOffsetX, -this.size/(5.5), this.size/3, this.size/3);
			image(ladybugFootImg, this.size*(-1/9-1/4)+this.legOffsetX, -this.size/(6), this.size/3, this.size/3);
		}
			
		image(ladybugImg, 0, -this.size/2-this.size/10, this.size, this.size);
		pop();
		pop();
	}
	return this;
}

var Ant = function(id, x, y, size){
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
		rect(-this.size/2, -this.size * 0.90, this.size, this.size * 0.20, 10)
		fill(0, 250, 0);
		rect(-this.size/2, -this.size * 0.90, this.size*percentage, this.size * 0.20, 10);
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
		image(antImg, 0, -this.size/2-this.size/10, this.size, this.size);
		if(this.frontLegUp){
			image(antFootImg, this.size*(0/9+1/6)+this.legOffsetX, -this.size/(5.5), this.size/3, this.size/3);
			image(antFootImg, this.size*(0/9)-this.legOffsetX, -this.size/(6), this.size/3, this.size/3);
			image(antFootImg, this.size*(0/9-1/6)+this.legOffsetX, -this.size/(5.5), this.size/3, this.size/3);
		} else{
			image(antFootImg, this.size*(0/9+1/6)+this.legOffsetX, -this.size/(6), this.size/3, this.size/3);
			image(antFootImg, this.size*(0/9)-this.legOffsetX, -this.size/(5.5), this.size/3, this.size/3);
			image(antFootImg, this.size*(0/9-1/6)+this.legOffsetX, -this.size/(6), this.size/3, this.size/3);
		}
			
		pop();
		pop();
	}
	return this;
}

var Spider = function(id, x, y, size){
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
		rect(-this.size/2, -this.size * 1.00, this.size, this.size * 0.20, 10)
		fill(0, 250, 0);
		rect(-this.size/2, -this.size * 1.00, this.size*percentage, this.size * 0.20, 10);
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

		image(spiderImg, 0, -this.size/2-this.size/10, this.size, this.size);
		if(this.frontLegUp){
			image(spiderFootImg, this.size*(-0/9+3/16)+this.legOffsetX, -this.size/(5.5), this.size/3, this.size/3);
			image(spiderFootImg, this.size*(-0/9+1/16)-this.legOffsetX, -this.size/(6), this.size/3, this.size/3);
			image(spiderFootImg, this.size*(-0/9-1/16)+this.legOffsetX, -this.size/(5.5), this.size/3, this.size/3);
			image(spiderFootImg, this.size*(-0/9-3/16)-this.legOffsetX, -this.size/(6), this.size/3, this.size/3);
		} else{
			image(spiderFootImg, this.size*(-0/9+3/16)+this.legOffsetX, -this.size/(6), this.size/3, this.size/3);
			image(spiderFootImg, this.size*(-0/9+1/16)-this.legOffsetX, -this.size/(5.5), this.size/3, this.size/3);
			image(spiderFootImg, this.size*(-0/9-1/16)+this.legOffsetX, -this.size/(6), this.size/3, this.size/3);
			image(spiderFootImg, this.size*(-0/9-3/16)-this.legOffsetX, -this.size/(5.5), this.size/3, this.size/3);
		}
			
		pop();
		pop();
	}
	return this;
}

var Grass= function(id, x, size){
	this.id = id
	this.x = x
	this.size = size
	this.draw = function(){
		image(grassPatchImg, this.x, -this.size/2, this.size*(500/300), this.size);
		// console.log("rendered grass")
	}
	return this;
}

var Flower = function(id, x, height, hasFlowerHead, hasLeaf, flowerHeadColor){
	this.id = id;
	this.x = x;
	this.height = height;
	this.hasFlowerHead = hasFlowerHead;
	this.flowerHeadColor = flowerHeadColor
	this.flowerHead = new FlowerHead(x, -height, flowerHeadColor);
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
			this.leaves[i]=new Leaf(x+50, -((i+0.5)*75), false);
		} else{
			this.leaves[i]=new Leaf(x-50, -((i+0.5)*75), true);
		}
		doLeafFlip = !doLeafFlip;
	}
	this.draw = function(){
		image(stemImg, this.x, -this.height/2, 150, this.height);
	}
	return this;
}

var FlowerHead = function(x,y, color){
	this.x = x;
	this.y = y;
	this.color = color;

	this.size = 150;

	this.draw = function(){
		if(this.color == "white"){
			image(flowerWhiteImg, this.x, this.y, this.size, this.size);
		} else if(this.color == "yellow"){
			image(flowerYellowImg, this.x, this.y, this.size, this.size);
		}

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
			image(leafImg, 0, 0, this.size, this.size*3/4);

		} else{
			scale(-1, 1)
			image(leafImg, 0, 0, this.size, this.size*3/4);
		}
		pop();
	}
	return this;
}

function keyPressed() {
	var sizeChange = 0;
	var speedChange = 0;
	var resetStats = false;
	
	var abilityCards;
	var abilityChoicesActive = false;
	var abilityChoices;
	for(let i in players) {
		if(players[i].id === my_id) {
			abilityCards = players[i].abilityCards;
			abilityChoicesActive = players[i].abilityChoicesActive;
			abilityChoices = players[i].abilityChoices;
		}
	}
	var abilityCard;
	var whatAbility;


	if(key === "1"){
		if(1 <= abilityCards.length){
			whatAbility = 0; //antihack - use indices instead of ability
			socket.emit("usedAbility", {whatAbility});
		}
	}
	if(key === "2"){
		if(2 <= abilityCards.length){
			whatAbility = 1;
			socket.emit("usedAbility", {whatAbility});
		}
	}
	if(key === "3"){
		if(3 <= abilityCards.length){
			whatAbility = 2;
			socket.emit("usedAbility", {whatAbility});
		}
	}
	if(key === "4"){
		if(4 <= abilityCards.length){
			whatAbility = 3;
			socket.emit("usedAbility", {whatAbility});
		}
	}
	if(key === "5"){
		if(5 <= abilityCards.length){
			whatAbility = 4;
			socket.emit("usedAbility", {whatAbility});
		}
	}
	if(key === "6"){
		if(6 <= abilityCards.length){
			whatAbility = 5;
			socket.emit("usedAbility", {whatAbility});
		}
	}
	if(key === "7"){
		if(7 <= abilityCards.length){
			whatAbility = 6;
			socket.emit("usedAbility", {whatAbility});
		}
	}
	if(key === "8"){
		if(8 <= abilityCards.length){
			whatAbility = 7;
			socket.emit("usedAbility", {whatAbility});
		}
	}
	if(key === "9"){
		if(9 <= abilityCards.length){
			whatAbility = 8;
			socket.emit("usedAbility", {whatAbility});
		}
	}

	if (key === " "){
		socket.emit("doJump", {key}); //it needs actual variable data so key works fine
	}

	if (key === "Enter"){
		if(!isSpectating){
			typingChat = !typingChat
			if(!typingChat){
				//send the chat
				var chatMessage = playerChat
				if(chatMessage === ""){
					chatMessage = " "
				}
				socket.emit("chatMessage", {chatMessage});
				removeElements();
			} else{
				playerChat = ""
				chatInp = createInput("")
				centerChatInput()
				chatInp.input(setChat);
				chatInp.elt.focus();
				chatInp.style('text-align', 'center');
				chatInp.style('font-size', '30');
			}
		} else{
			startGame()
		}
	}
}

function mouseClicked() {
	var abilityChoices;
	var abilityChoicesActive;
	var abilityCards;
	if(!isSpectating){
		for(let i in players) {
			if(players[i].id === my_id) {
				abilityChoices = players[i].abilityChoices;
				abilityCards = players[i].abilityCards;
				abilityChoicesActive = players[i].abilityChoicesActive;
			}
		}
		var abilityCard;
		var totalMenuWidth = ((abilityChoices.length)*(windowHeight/7)) + ((abilityChoices.length-1)*(windowHeight/55));
		var clickedCard = false
	  
		if(abilityChoicesActive){
			for(let i in abilityChoices){
				if(((windowWidth*0.5-(totalMenuWidth/2) + i*(windowHeight/7)+(i)*(windowHeight/55))<mouseX && mouseX<(windowWidth*0.5-(totalMenuWidth/2) + i*(windowHeight/7)+(i)*(windowHeight/55) + windowHeight/7) && (windowHeight*0.4-windowHeight/14)<mouseY && mouseY<(windowHeight*0.4-windowHeight/14 + windowHeight/7))){
					clickedCard = true
					abilityCard = i;
					socket.emit("choseCard", {abilityCard});
					break;
				}
			}
		}
		if(!(clickedCard)){
			socket.emit("doBoost", {clickedCard});
		}
	}
}

function sendInputData() { //client specific p5 stuff that the server cant get
	var headAngle;

	for(let i in players) {
		if(players[i].id === my_id) {
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