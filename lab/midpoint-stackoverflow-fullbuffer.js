/**
 *	Porting code described from http://stackoverflow.com/questions/10878209/midpoint-circle-algorithm-for-filled-circles
 *	to javascript.  this is to be used to test speeds of different drawing algorithms.
 */
var canvas = null, context = null, imgData = null, data = null, centerX, centerY, radius, canvasWidth, numLinesToDraw, numLinesDrawn = 0;
function init() {
	canvas = document.getElementById('canvas');
	context = canvas.getContext('2d');
	context.beginPath();
	context.rect(0, 0, canvas.width, canvas.height);
	context.fillStyle = '#000';
	context.fill();

	imgData = this.context.getImageData(0,0,canvas.width, canvas.height);
	data = imgData.data;
	canvasWidth = canvas.width;

}

function draw() {
	console.time('draw');

	centerX = Math.round(canvas.width / 2),
	centerY = Math.round(canvas.height / 2),
	radius = 128;
	numLinesToDraw = radius * 2 + 1;
	
	var x = radius,
		y = 0,
		radiusError = 1 - x;
	var startX, endX

	var drawCircle = function() {
		if (x >= y)  // iterate to the circle diagonal
		{

			// use symmetry to draw the two horizontal lines at this Y with a special case to draw
			// only one line at the centerY where y == 0
			startX = -x + centerX;
			endX = x + centerX;         
			drawHorizontalLine( startX, endX, y + centerY );
			if (y != 0)
			{
				drawHorizontalLine( startX, endX, -y + centerY );
			}

			// move Y one line
			y++;

			// calculate or maintain new x
			if (radiusError<0)
			{
				radiusError += 2 * y + 1;
			} 
			else 
			{
				// we're about to move x over one, this means we completed a column of X values, use
				// symmetry to draw those complete columns as horizontal lines at the top and bottom of the circle
				// beyond the diagonal of the main loop
				if (x >= y)
				{
					startX = -y + 1 + centerX;
					endX = y - 1 + centerX;
					drawHorizontalLine( startX, endX,  x + centerY );
					drawHorizontalLine( startX, endX, -x + centerY );
				}
				x--;
				radiusError += 2 * (y - x + 1);
			}
			setTimeout(drawCircle, 0);
			return;
		}
		context.putImageData(imgData, 0, 0);
		console.timeEnd('draw');
	}
	setTimeout(drawCircle, 0);


}


function drawHorizontalLine(startX, endX, y) {
	if(startX > endX) {
		var tmp = startX;
		startX = endX;
		endX = tmp;
	}
	var dist, angle, h, l, correctedX, correctedY = y - centerY;
	for(var x = startX; x <= endX; x++) {
		correctedX = x - centerX;
		dist = Math.sqrt(correctedX*correctedX + correctedY*correctedY);
		angle = Math.atan2(correctedY, correctedX) * 180 / Math.PI;
		h = angle / 360;
		l = 1 - (dist / 128);
		rgb = Col.hslToRgb(h,1,l);
		i = (y * canvasWidth + x) * 4;
		data[i + 0] = rgb[0];
		data[i + 1] = rgb[1];
		data[i + 2] = rgb[2];
		data[i + 3] = 255;
	}
	numLinesDrawn++;
	console.log((numLinesDrawn / numLinesToDraw) * 100);
}