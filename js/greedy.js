var w = 480;
var h = 640;
var maxh = 420;

var game;
var c;

var bubbles = [];
var bullets = [];
var turret;

var cash = 50;

var mpos;

var interval = 1.0 / 30;

var MAX_BUBBLES = 15;
var BUBBLE_GENERATION_PROB = 0.05;

var clicked = false;

var frames = 0;

var sprite;
var sprite1 = new Image();
var sprite2 = new Image();
var sprite3 = new Image();

var pop = new Image();

var dollar = new Image();

var NEWS_GENERATION_PROB = 0.06;
var PANIC_GENERATION_PROB = 0.01;
var URL = "http://venturecrapital.us";
var newsStory = [];

/* OBJECT CLASSES
**************************************************************************************/
function Pos(x, y) {
	this.x = x;
	this.y = y;
}
mpos = new Pos(w/2, 0);

function Bubble(x, y, radius, worth, growth, goodchance, panicchance) {
	this.x = x;
	this.y = y;
	this.radius = radius;
	
	this.vx = Math.random()-.5;
	this.vy = Math.random()-.5;
	
	this.name = "";
	this.permalink = "";
	
	this.invested = 0;
	this.gains = 0;
	
	this.worth = worth;
	
	this.growth = growth;
	this.goodchance = goodchance;
	this.panicchance = panicchance;
	
	this.state = 1;
	this.counter = 0;
	
	this.isAlive = true;
	
	this.collidesWithPoint = function(p) {
		return ((Math.sqrt(Math.pow(this.x-p.x, 2) + Math.pow(this.y-p.y, 2)))<this.radius);
	}
	
	this.update = function() {
		var growthPerFrame = 1 + (this.growth/6) * interval;
		
		this.radius *= growthPerFrame;
		this.worth *= growthPerFrame;
		this.gains *= growthPerFrame;
	}
	
	this.move = function() {
		this.x += this.vx;
		this.y += this.vy;
	}
	
	this.draw = function() {
		if(this.state == 1) {
			c.save();
			c.strokeStyle='rgba(121, 213, 254, 0.75)'
			strokeCirc(this.x, this.y, this.radius)
			c.fillStyle='rgba(121, 213, 254, 0.5)'
			fillCirc(this.x, this.y, this.radius);
		
			c.fillStyle = '#1E2B3F';
			var textDms = c.measureText(this.name);
			c.fillText(this.name, this.x-(textDms.width/2), this.y);
		
			c.restore();
		} else if(this.state == 2) {
			this.alive=false;
			if(this.counter > 0) {
				c.drawImage(pop, this.x, this.y);
				this.vx = 0;
				this.vy = 0;
				this.counter--;
			}
		}
	}
}

function Bullet(x, y) {
	this.x = x;
	this.y = y;
	
	this.tx = mpos.x;
	this.ty = mpos.y;
	
	this.theta = Math.atan2(this.ty - this.y, this.tx - this.x);
	this.vx = 2 * Math.cos(this.theta);
	this.vy = 2 * Math.sin(this.theta);
	
	this.move = function() {
		this.x += this.vx;
		this.y += this.vy;
	}
	
	this.draw = function() {
		c.save();
		c.translate(this.x, this.y);
		c.rotate(this.theta);
		c.drawImage(dollar, -10, -10);
		c.restore();
	}
}

function Turret() {
	this.x = w/2;
	this.y = h-175;
	
	this.state = 1;
	this.counter = 0;
	
	this.shooting = function() {
		return !(this.state==1 || (this.state==3 && this.counter < 25));
	}
	
	this.draw = function() {
		if(this.state == 2) {
			if(this.counter == 0) {
				this.state = 3;
				sprite = sprite3;
				this.counter = 30;
			} else {
				this.counter--;
			}
		} else if(this.state == 3) {
			if(this.counter == 30) {
				bullets.push(new Bullet(turret.x, turret.y));
				cash--;
				
				this.counter--;
			} else if(this.counter==0) {
				this.state = 1;
				sprite = sprite1;
			} else {
				this.counter--;
			}			
		}
		c.drawImage(sprite, 150, h-200);
	}
}

/* COLLISIONS
**************************************************************************************/
function checkBulletBounds() {
	for(var i=0; i<bullets.length; i++) {
		var b = bullets[i];
	
		if(b.x<0 || b.x>w || b.y<0 || b.y>h) {
			bullets.splice(i, 1);
			i--;
		}
	}
}
function checkBubbleBounds() {
	for(var i=0; i<bubbles.length; i++) {
		var b = bubbles[i];
		
		if(b.x<b.radius || b.x>w-b.radius) {
			b.vx *= -1;
			if(b.x<b.radius) {
				b.x=b.radius;
			} else {
				b.x=w-b.radius;
			}
		} else if(b.y<b.radius || b.y>maxh-b.radius) {
			b.vy *= -1;
			if(b.y<b.radius) {
				b.y=b.radius;
			} else {
				b.y=maxh-b.radius;
			}
		}
	}
}
function checkBubblesWithBullets() {
	for(var i=0; i<bullets.length; i++) {
		var bullet = bullets[i];
		for(var j=0; j<bubbles.length; j++) {
			var bubble = bubbles[j];
			
			if(bubble.isAlive && bubble.collidesWithPoint(bullet)) {
				bubble.radius += 2;
				bubble.invested++;
				bubble.gains++;
				
				bullets.splice(i, 1);
			}
		}
	}
}
function checkBubbleSize() {
	for(var i=0; i<bubbles.length; i++) {
		var b = bubbles[i];
		if(b.isAlive && (b.radius < 10 || b.radius > 90)) {
			cash -= b.gains;
			b.state = 2;
			b.counter = 30;
			b.isAlive = false;
		} else if(!b.isAlive && b.counter==0) {
			bubbles.splice(i, 1);
		}
	}
}
function checkBounds() {
	checkBubbleBounds();
	checkBulletBounds();
	checkBubblesWithBullets();
	checkBubbleSize();
}

function randomBubble() {
	return new Bubble(Math.random()*w, Math.random()*h, 20);
}

/* Canvas methods to draw circles
**************************************************************************************/
function circle(x, y, radius) {
	c.beginPath();
	c.arc(x, y, radius, 0, Math.PI*2, false);
	c.closePath();
}
function fillCirc(x, y, radius) {
	circle(x, y, radius);
	c.fill();
}
function strokeCirc(x, y, radius) {
	circle(x, y, radius);
	c.stroke();
}

function getCursorPosition(e) {
	var x;
	var y;

	if(e.offsetX) {
		x = e.offsetX;
		y = e.offsetY;
	} else if(e.layerX) {
		x = e.layerX;
		y = e.layerY;
	}

	return new Pos(x, y);
}

/* MOUSE HANDLERS
**************************************************************************************/
function startCashThrow() {
	turret.state = 2;
	turret.counter = 10;
	sprite = sprite2;
}
function hoverOnBubble() {
	for(var i=0; i<bubbles.length; i++) {
		var b = bubbles[i];
		if(b.isAlive && b.collidesWithPoint(mpos)) {
			return true;
		}
	}
	return false;
}
function clickedOnBubble() {
	for(var i=0; i<bubbles.length; i++) {
		var b = bubbles[i];
		if(b.collidesWithPoint(mpos)) {
			bubbles.splice(i, 1);
			cash += b.gains;		
			return true;
		}
	}
	return false;
}
function handleMouseDown(e) {
	clicked = false;
	
	mpos = getCursorPosition(e);

	if(!clickedOnBubble() && cash>0 && !turret.shooting()) {
		startCashThrow();
	}
}
function handleMouseUp(e) {
	clicked = false;
}
function handleMove(e) {
	mpos = getCursorPosition(e);	
}

/* DRAW LOOP
**************************************************************************************/
function getLines(phrase, maxLength) {
	var wa=phrase.split(" "),
		phraseArray=[],
		lastPhrase="",
		l = maxLength,
		measure=0;
	for (var i=0;i<wa.length;i++) {
		var w = wa[i];
		measure = c.measureText(lastPhrase+w).width;
		if (measure < l) {
			lastPhrase+=(" "+w);
		}else {
			phraseArray.push(lastPhrase);
			lastPhrase=w;
		}
		if (i===wa.length-1) {
			phraseArray.push(lastPhrase);
			break;
		}
	}
	return phraseArray;
}
Number.prototype.formatMoney = function(c, d, t) {
	var n = this, c = isNaN(c = Math.abs(c)) ? 2 : c, d = d == undefined ? "," : d, t = t == undefined ? "." : t, s = n < 0 ? "-" : "", i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", j = (j = i.length) > 3 ? j % 3 : 0;
   		return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};
function drawHeadlines() {
	for(var i=0; i<newsStory.length; i++) {
		c.fillText(newsStory[i],280,h-95+(20*i),100);
	}
}
function drawMoney() {
	c.save();
	c.shadowOffsetX = 1;
	c.shadowOffsetY = 1;
	c.shadowBlur = 3;
	c.shadowColor = "rgba(0, 0, 0, 0.5)";
	
	c.fillStyle = '#fff';
	c.fillText('$'+(Math.round(cash)*100000).formatMoney(0, '.', ','), 50, h-60);
	c.restore();
}

function draw() {
	turret.draw();
	
	for(var i=0; i<bubbles.length; i++) {
		var bubble = bubbles[i];
		bubble.draw();
	}
	for(var i=0; i<bullets.length; i++) {
		var bullet = bullets[i];
		bullet.draw();
	}
	
	c.font = "12pt Arial";
	drawMoney();
	drawHeadlines();
	
	if(hoverOnBubble()) {
		document.getElementById('game').style.cursor = 'pointer';
	} else {
		document.getElementById('game').style.cursor = 'default';
	}
}
function update() {
	for(var i=0; i<bubbles.length; i++) {
		var bubble = bubbles[i];
		bubble.update();
		bubble.move();
	}
	
	for(var i=0; i<bullets.length; i++) {
		var bullet = bullets[i];
		bullet.move();
	}
	
	checkBounds();
}
function loop() {
	game.width = game.width; // clear canvas element

	frames++;

	draw();
	update();
	
	maybeAddBubble();
	maybeAddNewsStory();
	
	maybePanic();
	
	setTimeout('loop()', interval);
}

function maybePanic(){
	if(Math.random() <= PANIC_GENERATION_PROB*interval){
		panic();
	}
}

function panic(){
	for(var i = 0; i < bubbles.length; i++){
		var randy = Math.random();
		if (randy < bubbles[i].panicchance){
			bubbles.splice(i,1);
			i--;
		}
	}
}

function setup(n) {
	for (var j = 0; j < n; j++) {
		addBubble();
	}
}

function maybeAddBubble() {
	if (bubbles.length < MAX_BUBBLES) {
		if (Math.random() <= BUBBLE_GENERATION_PROB * interval) {
			addBubble();
		}
	}
}

function addBubble() {
	var xPos = Math.floor(Math.random() * (w + 1));
	var yPos = Math.floor(Math.random() * (maxh + 1));
	var b = null;

	$.getJSON(URL+'/company/random?callback=?', function(data) {
		var num_of_employees = data['number_of_employees'];
		var worth;
		var radius;
		var growth;
		var goodchance;
		var panicchance;
		if(num_of_employees == null || num_of_employees <= 3) {
			worth = 500000;
			growth = 0.12;
			goodchance = 0.5;
			panicchance = 0.4;
			radius = 15;
		} else if(num_of_employees > 101) {
			worth = 10000000;
			growth = 0.01;
			goodchance = 0.35;
			panicchance = 0.1;
			radius = 30;
		} else if(num_of_employees > 20) {
			worth = 50000000;
			growth = 0.02;
			radius = 25;
			goodchance = 0.5;
			panicchance = 0.1;
		} else if(num_of_employees > 11) {
			worth = 10000000;
			growth = 0.05;
			radius = 20;
			goodchance = 0.45;
			panicchange = 0.2;
		} else if(num_of_employees > 4) {
			worth = 1000000;
			growth = 0.06;
			radius = 17;
			goodchance = 0.5;
			panicchange = 0.3;
		}
		var b = new Bubble(xPos, yPos, radius,worth,growth, goodchance,panicchance);
		b.name = data['name'];
		b.permalink = data['permalink']
		bubbles.push(b);
	});
}

function maybeAddNewsStory(){
	if(Math.random() <= NEWS_GENERATION_PROB*interval){
		addNewsStory();
	}
}

function addNewsStory(){
	var num_companies = bubbles.length;
	var i = Math.floor(Math.random() * (num_companies));
	var selectedBubble = bubbles[i];
	var good = 0;
	if(selectedBubble!=undefined) {
		if(selectedBubble.goodchance > Math.random()){
			good = 1;
		}
		$.getJSON(URL+'/story/'+selectedBubble.permalink+'?good='+good+'&callback=?',
		function(data) {
			newsStory = getLines(data['story'], 170);
			var val = data['value']/100;
			if(good == 0){
				val = -1*val;
			}
			selectedBubble.growth += val;
		});
	}
}


window.addEventListener('load', function() {
	game = document.getElementById('game');
	c = game.getContext('2d');
	
	game.addEventListener('mousedown', handleMouseDown);
	game.addEventListener('mouseup', handleMouseUp);
	game.addEventListener('mousemove', handleMove);
	
	setup(3);
	
	sprite1.src = "images/sprite1.png";
	sprite2.src = "images/sprite2.png";
	sprite3.src = "images/sprite3.png";
	sprite = sprite1;
	
	pop.src = "images/pop.png";
	
	dollar.src = "images/cash.png"
	
	turret = new Turret();
	
	loop();
})