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
	button.style('font-size', windowHeight*0.05);
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
	button.style('font-size', windowHeight*0.05);
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
		rankedFlowers[i].draw();
		for(let j in rankedFlowers[i].leaves){
			if(rankedFlowers[i].hasLeaf[j]){
				rankedFlowers[i].leaves[j].draw();
			}
		}
	}

	for(let i in rankedFlowers) {
		if(rankedFlowers[i].hasFlowerHead){
			rankedFlowers[i].flowerHead.draw();
			//console.log("Flower Drawn!");
		}
	}
  
	var rankedPlayers = quickSort(players);

	for(let i in rankedPlayers) {
		rankedPlayers[i].draw();
		if(rankedPlayers[i].HP < rankedPlayers[i].maxHP){
			rankedPlayers[i].drawHP();
		}
		rankedPlayers[i].drawName();
	}

	var rankedLadybugs = quickSort(ladybugs);

	for(let i in rankedLadybugs) {
		rankedLadybugs[i].draw();
		if(rankedLadybugs[i].HP < rankedLadybugs[i].maxHP){
			rankedLadybugs[i].drawHP();
		}
	}

	var rankedAnts = quickSort(ants);

	for(let i in rankedAnts) {
		rankedAnts[i].draw();
		if(rankedAnts[i].HP < rankedAnts[i].maxHP){
			rankedAnts[i].drawHP();
		}
	}

	var rankedSpiders = quickSort(spiders);

	for(let i in rankedSpiders) {
		rankedSpiders[i].draw();
		if(rankedSpiders[i].HP < rankedSpiders[i].maxHP){
			rankedSpiders[i].drawHP();
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