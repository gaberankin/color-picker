/**
 *	Porting code described from http://en.wikipedia.org/wiki/Midpoint_circle_algorithm
 *	to javascript.  this is to be used to test speeds of different drawing algorithms.
 */
var canvas = null, context = null, imgData = null, data = null;
function init() {
	canvas = document.getElementById('canvas');
	context = canvas.getContext('2d');
	context.beginPath();
	context.rect(0, 0, canvas.width, canvas.height);
	context.fillStyle = '#000';
	context.fill();

	imgData = this.context.createImageData(1, 1);
	data = imgData.data;

	//go ahead and set to white.
	data[0] = 255;	
	data[1] = 255;	
	data[2] = 255;	
	data[3] = 255;


}

function draw() {
	console.time('draw');
	var x0 = 129,
		y0 = 129;
	var x, y, radiusError;
	for(var r = 0; r <= 128; r++) {
		console.time('draw r =' + r);
		x = r;
		y = 0;
		radiusError = 1 - r;

		while(x >= y)
		{
			drawPixel( x + x0,  y + y0);
			drawPixel( y + x0,  x + y0);
			drawPixel(-x + x0,  y + y0);
			drawPixel(-y + x0,  x + y0);
			drawPixel(-x + x0, -y + y0);
			drawPixel(-y + x0, -x + y0);
			drawPixel( x + x0, -y + y0);
			drawPixel( y + x0, -x + y0);
			y++;
			if (radiusError<0)
			{
				radiusError += 2 * y + 1;
			}
			else
			{
				x--;
				radiusError += 2 * (y - x) + 1;
			}
		}
		console.timeEnd('draw r =' + r);
	}
	console.timeEnd('draw');
}

function drawPixel(x, y) {
	context.putImageData(imgData, x, y);
}