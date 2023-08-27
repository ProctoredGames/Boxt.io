
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

var mapSize = 6000;

//loads assets on start of game
function preload(){
	shellBox = loadImage('assets/shellBox.png');
	shellDome = loadImage('assets/shellDome.png');
	// shellSpike = loadImage('assets/shellSpike.png');
	// turtle = loadImage('assets/turtle.png');
	turtleHead = loadImage('assets/turtleHead.png');
	// turtleJaw = loadImage('assets/turtle.png');
	turtleFoot = loadImage('assets/turtleFoot.png');
	// turtleTail = loadImage('assets/turtle.png');
	stem = loadImage('assets/stem.png');
	leaf = loadImage('assets/leaf.png');
	flowerWhite = loadImage('assets/flowerWhite.png');
	flowerYellow = loadImage('assets/flowerYellow.png');
}

//first thing that is called. Sets up everything
function setup() {
    players = [];
    myId = 0;

    plants = [];

    socket = io();
    
    socket.emit("imReady", {name: "Devlogerio"});

    socket.on("yourId", function(data) {
        myId = data.id;
    });

    socket.on("newPlayer", function(data) {
        var player = new Player(data.id, data.name, data.x, data.y, data.size);
        players.push(player);
    });

    socket.on("initPack", function(data) {
        for(var i in data.initPack) {
            var player = new Player(data.initPack[i].id, data.initPack[i].name, data.initPack[i].x, data.initPack[i].y, data.initPack[i].size);
            players.push(player);
            console.log(myId);
        }
    });

    socket.on("updatePack", function(data) {
        for(var i in data.updatePack) {
            for(var j in players) {//gets the data from players as to render
                if(players[j].id === data.updatePack[i].id) {
                    players[j].x = data.updatePack[i].x;
                    players[j].y = data.updatePack[i].y;
                    players[j].size = data.updatePack[i].size;
                    players[j].doMovement = data.updatePack[i].doMovement;
                    players[j].legOffsetX = data.updatePack[i].legOffsetX;
                    players[j].frontLegUp = data.updatePack[i].frontLegUp;
                    players[j].isFlipped = data.updatePack[i].isFlipped;
                    players[j].shellType = data.updatePack[i].shellType;
                    players[j].angle = data.updatePack[i].angle;
                }
            }
        }
    });

    socket.on("someoneLeft", function(data) {
        for(var i in players) {
            if(players[i].id === data.id) {
                players.splice(i, 1);
            }
        }
    });
    for(var i =0; i< mapSize/100; i++){
    	testPlant = new Plant(Math.random()*mapSize, (Math.random()*300)+100);
    	plants.push(testPlant);
    }

	createCanvas(windowWidth,windowHeight);
	imageMode(CENTER);
	rectMode(CORNER);
}

//called every frame
function draw(){
	background(0, 0, 200); // it gets a hex/rgb color
    sendInputData();
    for(var i in players) {
        if(players[i].id === myId) {
        	var adjustedX;
        	//distance from right wall of map to right edge of screen
        	var widthFromMapToScreen;
        	if(players[i].isFlipped){
        		adjustedX = ((width/2+players[i].size/3) - players[i].x);
        		widthFromMapToScreen = (players[i].x-players[i].size/3+width/2)-mapSize;
        	} else{
        		adjustedX = ((width/2-players[i].size/3) - players[i].x);
        		widthFromMapToScreen = (players[i].x+players[i].size/3+width/2)-mapSize;
        	}
    		var adjustedY = ((height*0.75+players[i].size/3.5) - players[i].y);
            translate(adjustedX, adjustedY); //zooming in to 1/3 up the player
        }
    }

    fill(0, 0, 250);
    rect(-adjustedX, 0-adjustedY, adjustedX, windowHeight);
    rect(mapSize, 0-adjustedY, widthFromMapToScreen, windowHeight);
    fill(0, 150, 0);
    rect(0, 0, mapSize, windowHeight-adjustedY);

    for(var i = 0; i<(mapSize/100)/2; i++) {
        plants[i].draw();
        if(plants[i].hasFlower){
			plants[i].flower.draw();
		}
    }

    for(var i in players) {
        players[i].draw();
    }

    for(var i = (mapSize/100)/2; i<(mapSize/100); i++) {
        plants[i].draw();
        if(plants[i].hasFlower){
			plants[i].flower.draw();
		}
    }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

var Player = function(id, name, x, y, size){
	this.id = id;
	this.name = "";
	this.x = x;
	this.y = y;
	this.size = size;
	this.legOffsetX = 0;
	this.isFlipped;
	this.doMovement;
	this.angle = 0;
	this.shellType = "Box";

	this.draw = function(){
		var shellImg;
		switch(this.shellType){
		case "Box":
			shellImg = shellBox;
			break;
		case "Dome":
			shellImg = shellDome;
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
			rotate(this.angle)
		} else{
			rotate(Math.PI-this.angle)
		}
		image(turtleHead, this.size*0.05, -(this.size*0.05), this.size*(120/300), this.size/3);
		pop();
		image(shellImg, 0, -(this.size/2)-(this.size/6), this.size, this.size);
		pop();

	}
	return this;
}

function keyPressed() {
	var sizeChange = 0;
	var speedChange = 0;
	if(key === "w"){
		sizeChange = 10;
		console.log("bigger");
	}
	if(key === "s"){
		sizeChange = -10
		console.log("smaller");
	}
	if(key === "q"){
		speedChange = -1
	}
	if(key === "e"){
		speedChange = 1
	}
	socket.emit("commandData", {sizeChange, speedChange});

}

function sendInputData() { //the server changes the values, we tell it what to change.
	var angle;

	var headX;
	var headY;
	var range;

	for(var i in players) {
        if(players[i].id === myId) {
    		angle = atan2(mouseY-(height*0.75+players[i].size*-0.1), mouseX-(width/2)); //angle from head level
    		if(!players[i].isFlipped){
    			headX = players[i].x+players[i].size*0.55;
    		} else{
    			headX = players[i].x-players[i].size*0.55;
    		}
    		headY = players[i].y-players[i].size/3;
    		range = players[i].size/3
    	}
    }

	var distXToMouse = Math.abs(mouseX-(width/2));

	var isFlipped;
	if(mouseX>(width/2)){
		isFlipped = false;
	} else{
		isFlipped = true;
	}

	var sizeChange = 0;


	var hasFlower = true; //the server wont change it to true FYI, we just need to say something
	for(var i = 0; i< mapSize/100; i++){
		if(Math.sqrt(Math.pow(headX-plants[i].flower.x,2)+Math.pow(headY-plants[i].flower.y,2))< range){
			if(plants[i].hasFlower){
				plants[i].hasFlower = false; //TODO: request that the server change this for everybody
				sizeChange = plants[i].flower.xp;
				console.log("requested");
			} 
		}
	}


    socket.emit("inputData", {mouseX, mouseY, sizeChange, angle, distXToMouse, isFlipped, windowWidth, windowHeight});
}


var Plant = function(x, height){
	this.x = x;
	this.height = height;
	this.hasFlower = true;
	this.flower = new Flower(x, -height);
	this.draw = function(){
		image(stem, this.x, -this.height/2, 150, this.height);
	}
	return this;

}

var Flower = function(x,y){
	this.x = x;
	this.y = y;
	this.xp = 5+Math.random()*5;

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
		if(!(this.isFlipped)){
			scale(1, 1)
		} else{
			scale(-1, 1)
		}
		image(leaf, this.x, -this.y, this.size, this.size);
	}
	return this;

}