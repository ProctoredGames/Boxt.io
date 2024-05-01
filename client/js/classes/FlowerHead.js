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
