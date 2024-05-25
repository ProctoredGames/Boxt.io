function drawChangelog(){
	fill(0,0,0,200);
	rect(windowHeight*0.03, windowHeight*0.03, windowHeight*0.3, windowHeight*0.4, 20);
	fill(200, 200, 0);
	textSize(windowHeight*0.04);
	textAlign(CENTER);
	text("May 18", windowHeight*0.05, (windowHeight*0.055), windowHeight*0.25, windowHeight*0.04)
	fill(0, 200, 0);
	textSize(windowHeight*0.025);
	textAlign(LEFT);
	textWrap(WORD);
	text("• Reworked shell upgrades, you can now only choose one upgrade path\n• Made all text in game scale with window\n• Retextured the yellow flower in the jungle\n• New biome specific content in the works", windowHeight*0.05, 
			(windowHeight*0.10), windowHeight*0.28, windowHeight*0.33);

}

function drawLeaderboard(thisIndex){
	fill(0,0,0,200);
	rect(windowHeight*0.03, windowHeight*0.03, windowHeight*0.3, windowHeight*0.35, 20);
	fill(255, 255, 0);
	textSize(windowHeight*0.03);
	textAlign(CENTER);
	text("LEADERBOARD", windowHeight*0.055, (windowHeight*0.06), windowHeight*0.25, windowHeight*0.03)

	var rankedPlayers = quickSort(players);
	fill(0, 200, 0);
	textSize(windowHeight*0.025);
	textAlign(LEFT);

	var count = 1;
	for(let i in rankedPlayers){
		if(rankedPlayers[i].id === my_id){
			fill(255, 255, 0);
		}
		text(count + " | " + rankedPlayers[i].name + " : " + Math.round(rankedPlayers[i].XP), windowHeight*0.05, 
			(windowHeight*0.1)+(windowHeight*0.03)*i, windowHeight*0.28, windowHeight*0.025);
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
	textSize(windowHeight*0.025);

	text("Version 5.17.24", windowHeight*0.025, 112, windowHeight*0.25, windowHeight*0.025)

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

function drawMyAbilityChoices(thisIndex){
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
	drawMyAbilityChoices(index)
}