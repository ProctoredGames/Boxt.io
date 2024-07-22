var Spider = function(id, x, y, size){
	this.id = id;
	this.x = x;
	this.y = 0;
	this.size = 200;
	this.isFlipped = true;
	this.frontLegUp = true;
	this.legOffsetX = 0;
	this.legOffsetY = 0;
	this.drawHP = function(){
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
			image(spiderFootImg, this.size*(-0/9+3/16)-this.legOffsetX, -this.size/(6), this.size/3, this.size/3);
			image(spiderFootImg, this.size*(-0/9+1/16)+this.legOffsetX, -this.size/(5.5), this.size/3, this.size/3);
			image(spiderFootImg, this.size*(-0/9-1/16)-this.legOffsetX, -this.size/(6), this.size/3, this.size/3);
			image(spiderFootImg, this.size*(-0/9-3/16)+this.legOffsetX, -this.size/(5.5), this.size/3, this.size/3);
		} else{
			image(spiderFootImg, this.size*(-0/9+3/16)-this.legOffsetX, -this.size/(5.5), this.size/3, this.size/3);
			image(spiderFootImg, this.size*(-0/9+1/16)+this.legOffsetX, -this.size/(6), this.size/3, this.size/3);
			image(spiderFootImg, this.size*(-0/9-1/16)-this.legOffsetX, -this.size/(5.5), this.size/3, this.size/3);
			image(spiderFootImg, this.size*(-0/9-3/16)+this.legOffsetX, -this.size/(6), this.size/3, this.size/3);
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