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