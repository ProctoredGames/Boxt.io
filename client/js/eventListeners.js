

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

	if (key === "s"){
		console.log("sent hide request")
		socket.emit("hideBehindGrass", {key});
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