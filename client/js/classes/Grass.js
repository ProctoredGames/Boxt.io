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