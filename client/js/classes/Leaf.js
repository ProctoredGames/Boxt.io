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