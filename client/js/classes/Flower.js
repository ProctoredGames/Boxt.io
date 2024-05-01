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