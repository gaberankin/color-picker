var Col = (function(){

	var El = function(tagName, attributes) {
		el = document.createElement(tagName);
		if(attributes && typeof attributes == 'object') {
			for(attr in attributes) {
				if(attr == 'style'){
					if(typeof attributes.style == 'object') {
						for(css in attributes.style) {
							if((css == 'width' || css == 'height' || css == 'padding' || css == 'margin') && typeof attributes.style[css] == 'number')
								attributes.style[css] = attributes.style[css] + 'px';
							el.style[css] = attributes.style[css];
						}
					}
				} else {
					el.setAttribute(attr, attributes[attr]);
				}
			}
		}
		return el;
	}
	var Attach = function(){};

 	if (document.addEventListener) {  // all browsers except IE before version 9
 		Attach = function(element, eventName, func, useCapture) {
 			useCapture = useCapture === void 0 ? false : useCapture;
			element.addEventListener(eventName, func, useCapture);
		}
	} else {
		if (document.attachEvent) {   // IE before version 9
	 		Attach = function(element, eventName, func, useCapture) {
				element.attachEvent('on' + eventName, func);
			}
		}
	}

	var appendControlRow = function() {
		if(arguments.length < 2)
			return;
		var parent = arguments[0],
			row = El('div', {'class':'color-thing-control-row'}),
			numArgs = arguments.length,
			item = null;
		for(var i = 1; i < numArgs; i++) {
			if(typeof arguments[i] == 'object') {
				item = El('div', {'class':'color-thing-control-item'});
				if(arguments[i] instanceof Array) {
					for(var j in arguments[i]) {
						if(typeof arguments[i][j] == 'object') {
							try {
								item.appendChild(arguments[i][j]);
							} catch(e) {
								//do nothing.
							}					
						} else {
							t = El('span', {'class':'color-thing-control-text'});
							t.textContent = arguments[i][j];
							item.appendChild(t);
						}
					}
					row.appendChild(item);
				} else {
					try {
						item.appendChild(arguments[i]);
						row.appendChild(item);
					} catch(e) {
						//do nothing.
					}					
				}
			} else {
				item = El('div', {'class':'color-thing-control-text'});
				item.textContent = arguments[i];
				row.appendChild(item);
			}
		}
		parent.appendChild(row);
	}

	var drawHorizontalLine = function(instance, data, startX, endX, y, centerX, centerY) {
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
			rgb = Col.hslToRgb(h,instance.saturation,l);
			i = (y * instance.canvas.width + x) * 4;
			data[i + 0] = rgb[0];
			data[i + 1] = rgb[1];
			data[i + 2] = rgb[2];
			data[i + 3] = 255;
		}
		instance.drawProgress();
		instance.numLinesDrawn++;
	}

	var Col = function(container){
		var w = h = 256;
		var ox = (w / 2), oy = (h / 2);	//origin for point calculations
		var me = this;

		this.parentContainer = container;
		this.container = El('div', {'class':'color-thing-container', 'style': {'position':'relative'}});	//position relative for firefox mouse-event fix
		this.canvas = El('canvas', {'width': w,'height': h, 'style' : {'width': w,'height': h}});
		this.drawBuffer = El('canvas', {'width': w,'height': h, 'style' : {'width': w,'height': h}});
		this.controls = El('div', {'class': 'color-thing-controls'});
		this.parentContainer.appendChild(this.container);
		this.container.appendChild(this.canvas);
		this.container.appendChild(this.controls);
 
 		this.saturationSelector = El('input',{ 'type':'range', 'min': '0', 'max': '100', 'value': '100' });
		this.saturationSelectorVal = null;
		if(this.saturationSelector.type !== 'range'){	//fallback to select element
			this.saturationSelector = El('select');
			for(var i = 100; i >= 0; i -= 1) {
				this.saturationSelector.add(new Option(i + '%', i));
			}
			appendControlRow(this.controls, 'Saturation', this.saturationSelector);
		} else {
			this.saturationSelectorVal = El('span', {'class':'color-thing-selector-value'});
			this.saturationSelectorVal.textContent = '100%';
			appendControlRow(this.controls, 'Saturation', [this.saturationSelector, this.saturationSelectorVal]);
			Attach(this.saturationSelector, 'input', function(e){
				me.saturationSelectorVal.textContent = e.target.value+'%';
			});

		}


		this.saturation = 1;
		this.drawing = false;
		this.numLinesDrawn = 0;
		this.numLinesToDraw = 0;
		this.selection = {
			rgb: null,
			hsl: null,
			ox: null,
			oy: null,
			x: null,
			y: null
		};


		this.context = this.canvas.getContext('2d');
		this.drawBufferContext = this.drawBuffer.getContext('2d');

		if (!this.context.setLineDash) {
			this.context.setLineDash = function () {}
		}
		this.wheelData = {};
		var pipDrawn = false;

		var drawMousePip = function(x, y){
			me.draw();
			pipDrawn = true;
			me.context.beginPath();
			me.context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
			me.context.lineWidth = 1;
			me.context.setLineDash([2]);
			me.context.moveTo(x, 0);
			me.context.lineTo(x, me.canvas.height);
			me.context.moveTo(0, y);
			me.context.lineTo(me.canvas.width, y);
			me.context.stroke();

			me.context.beginPath();
			me.context.strokeStyle = '#000';
			me.context.setLineDash([]);
			me.context.lineWidth = 1;
			me.context.moveTo(x - 5, y);
			me.context.lineTo(x + 5, y);
			me.context.moveTo(x, y - 5);
			me.context.lineTo(x, y + 5);
			me.context.stroke();
		}
		var clearMousePip = function() {
			me.draw();
			pipDrawn = false;
		}

		Attach(this.canvas, 'mousemove', function(e) {
			if(me.drawing)
				return;
			var actualX, actualY;
			if (e.layerX || e.layerX == 0) {
				actualX = e.layerX;
				actualY = e.layerY;
			} else if(e.offsetX || e.offsetX == 0){
				actualX = e.offsetX;
				actualY = e.offsetY;
			}
			var x = actualX - ox;
			var y = actualY - oy;
			dist = Math.sqrt(x*x + y*y);

			if(dist <= ox) {
				drawMousePip(actualX, actualY);
				angle = Math.atan2(y, x) * 180 / Math.PI;
				h = angle / 360;
				l = 1 - (dist / 128);
				rgb = Col.hslToRgb(h,me.saturation,l);

				me.log(
					"(X,Y) = (" + x + ", " + y + ")\n" + 
					"angle = " + angle + "\n" + 
					"Distance = " + dist + "\n" +
					'<div style="background:rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ');color:' + (l < 0.5 ? '#fff' : '#000') + ';">rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')</div>'
				);
			} else {
				if(pipDrawn)
					clearMousePip();
			}
		});
		Attach(this.canvas, 'mouseout', function(e){
			if(pipDrawn)
				clearMousePip();
		});
		Attach(this.canvas, 'click', function(e){
			//draw the pip used to select a color.
			var actualX, actualY;
			if (e.layerX || e.layerX == 0) {
				actualX = e.layerX;
				actualY = e.layerY;
			} else if(e.offsetX || e.offsetX == 0){
				actualX = e.offsetX;
				actualY = e.offsetY;
			}
			var x = actualX - ox;
			var y = actualY - oy;
			dist = Math.sqrt(x*x + y*y);

			if(dist <= ox) {
				angle = Math.atan2(y, x) * 180 / Math.PI;
				h = angle / 360;
				l = 1 - (dist / 128);
				rgb = Col.hslToRgb(h,me.saturation,l);

				me.selection = {
					rgb: rgb,
					hsl: [h,me.saturation,l],
					ox: x,
					oy: y,
					x: actualX,
					y: actualY
				};

				me.draw();
			}
		});
		Attach(this.saturationSelector, 'change', function(e){
			if(me.saturationSelectorVal)
				me.saturationSelectorVal.textContent = e.target.value+'%';
			me.draw(e.target.value/100);
		});

		//initialize context with black so progress bar on initial draw is visible.
		this.context.beginPath();
		this.context.rect(0, 0, this.canvas.width, this.canvas.height);
		this.context.fillStyle = '#000';
		this.context.fill();
		me.draw();
	}
	/**
	 *	Draws the color picker to the canvas.
	 *	Note that it uses the wheelData array to see if the picker for the selected saturation has already
	 *	been created.  if it has, then we use that, resulting in a quicker draw time.
	 *	Otherwise, we use a variant of the midpoint circle algorithm (thanks to http://stackoverflow.com/questions/10878209/midpoint-circle-algorithm-for-filled-circles)
	 */
	Col.prototype.draw = function(saturation){
		if(this.drawing) {
			try {
				console.error("Please wait while process completes before attempting to call draw method.")
			} catch(e){

			}
			return;
		}
		this.numLinesDrawn = 0;

		this.saturation = saturation === void 0 ? this.saturation : parseFloat(saturation);

		if(this.wheelData['d' + this.saturation] === void 0) {
			var imageData, imageDataData, centerX, centerY, x, y, radius, radiusError, startX, endX;

			this.drawBufferContext.beginPath();
			this.drawBufferContext.rect(0, 0, this.canvas.width, this.canvas.height);
			this.drawBufferContext.fillStyle = '#000';
			this.drawBufferContext.fill();

			imageData = this.drawBufferContext.getImageData(0, 0, this.canvas.width, this.canvas.height);
			imageDataData = imageData.data;


			centerX = Math.round(this.canvas.width / 2),
			centerY = Math.round(this.canvas.height / 2),
			radius = 128;
			this.numLinesToDraw = radius * 2 + 1;
			
			x = radius;
			y = 0;
			radiusError = 1 - x;
			var me = this;

			var drawCircle = function() {
				if (x >= y) {  // iterate to the circle diagonal

					// use symmetry to draw the two horizontal lines at this Y with a special case to draw
					// only one line at the centerY where y == 0
					startX = -x + centerX;
					endX = x + centerX;         
					drawHorizontalLine(me, imageDataData, startX, endX, y + centerY, centerX, centerY );
					if (y != 0) {
						drawHorizontalLine(me, imageDataData, startX, endX, -y + centerY , centerX, centerY);
					}

					// move Y one line
					y++;

					// calculate or maintain new x
					if (radiusError<0) {
						radiusError += 2 * y + 1;
					} else {
						// we're about to move x over one, this means we completed a column of X values, use
						// symmetry to draw those complete columns as horizontal lines at the top and bottom of the circle
						// beyond the diagonal of the main loop
						if (x >= y)
						{
							startX = -y + 1 + centerX;
							endX = y - 1 + centerX;
							drawHorizontalLine(me, imageDataData, startX, endX,  x + centerY, centerX, centerY );
							drawHorizontalLine(me, imageDataData, startX, endX, -x + centerY, centerX, centerY );
						}
						x--;
						radiusError += 2 * (y - x + 1);
					}
					setTimeout(drawCircle, 0);
					return;
				}
				me.drawBufferContext.putImageData(imageData, 0, 0);
				me.drawBufferContext.beginPath();
				me.drawBufferContext.arc(128, 128, 129, 0, 2 * Math.PI, false);
				me.drawBufferContext.lineWidth = 1;
				me.drawBufferContext.strokeStyle = 'rgba(255,255,255,0.3)';
				me.drawBufferContext.stroke();
				me.wheelData['d' + me.saturation] = me.drawBufferContext.getImageData(0,0, me.canvas.width, me.canvas.height);
				me.context.putImageData(me.wheelData['d' + me.saturation], 0, 0);
				me.drawing = false;
				me.drawSelectionPip();
			}
			this.drawing = true;
			setTimeout(drawCircle, 0);

		}
		else
		{
			this.context.putImageData(this.wheelData['d' + this.saturation], 0, 0);
			this.drawSelectionPip();
		}
	}

	Col.prototype.drawProgress = function() {
		var progressBarWidth = 100,
			progressBarHeight = 10;
		var rx = Math.round(this.canvas.width / 2) - Math.round(progressBarWidth / 2),
			ry = Math.round(this.canvas.height / 2) - Math.round(progressBarHeight / 2);
		var progressBarProgressWidth = Math.round(this.numLinesDrawn / this.numLinesToDraw * progressBarWidth);

		this.context.beginPath();
		this.context.setLineDash([]);
		this.context.lineWidth="1";
		this.context.strokeStyle="#fff";
		this.context.rect(rx,ry,progressBarWidth,progressBarHeight);
		this.context.stroke();
		this.context.beginPath();
		this.context.fillStyle="#fff";
		this.context.rect(rx,ry,progressBarProgressWidth,progressBarHeight);
		this.context.fill();
	}

	Col.prototype.drawSelectionPip = function(x, y, brightness) {
		if(this.selection.x !== null && this.selection.y !== null && this.selection.hsl !== null){
			this.context.beginPath();
			this.context.lineWidth = 1;
			if(this.selection.hsl[2] > 0.4)
				this.context.strokeStyle = 'rgba(0,0,0,1)';
			else
				this.context.strokeStyle = 'rgba(255,255,255,1)';
			this.context.setLineDash([]);
			this.context.moveTo(this.selection.x - 5, this.selection.y);
			this.context.lineTo(this.selection.x + 5, this.selection.y);
			this.context.moveTo(this.selection.x, this.selection.y - 5);
			this.context.lineTo(this.selection.x, this.selection.y + 5);
			this.context.stroke();
		}
	}

	Col.prototype.setSaturation = function(saturation) {
		saturation = Math.floor(saturation * 100);
		this.saturationSelector.value = saturation;
		this.draw(saturation / 100);
	}

	Col.prototype.rgb = function(){
		if(arguments.length == 0) {
			return this.selection.rgb
		}
		var r = arguments[0] * 1, g, b;
		if(arguments[1] === void 0)
			g = r;
		else
			g = arguments[1] * 1;
		if(arguments[2] === void 0)
			b = g;
		else
			b = arguments[2] * 1;

		hsl = Col.rgbToHsl(r, g, b);
		this.selection.rgb = [r, g, b];
		this.selection.hsl = hsl;
		var xy = Col.hueAndLuminanceToXY(hsl[0], hsl[2]);
		this.selection.x = xy[0] + 128;
		this.selection.y = xy[1] + 128;
		this.selection.ox = xy[0];
		this.selection.oy = xy[1];
		this.setSaturation(hsl[1]);
	}

	Col.prototype.show = function(positionX, positionY){

	}

	Col.prototype.attachTo = function(element){

	}

	Col.prototype.debug = function(element) {
		this.debugElement = element;
		this.log = function(str) {
			this.debugElement.innerHTML = str.replace(/\n/g, '<br />');
		}
	}
	Col.prototype.log = function(){}

	/**
	 * http://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
	 *	originally found inside hlsToRgb().  took it out because why declare it every time the function is called (it could be called a lot)?
	 */
	Col.hue2rgb = function(p, q, t){
		if(t < 0) t += 1;
		if(t > 1) t -= 1;
		if(t < 1/6) return p + (q - p) * 6 * t;
		if(t < 1/2) return q;
		if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
		return p;
	}

	/**
	 * http://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
	 * Converts an HSL color value to RGB. Conversion formula
	 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
	 * Assumes h, s, and l are contained in the set [0, 1] and
	 * returns r, g, and b in the set [0, 255].
	 *
	 * @param   Number  h       The hue
	 * @param   Number  s       The saturation
	 * @param   Number  l       The lightness
	 * @return  Array           The RGB representation
	 */
	Col.hslToRgb = function(h, s, l){
		var r, g, b;

		if(s == 0){
			r = g = b = l; // achromatic
		} else {
			var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			var p = 2 * l - q;
			r = Col.hue2rgb(p, q, h + 1/3);
			g = Col.hue2rgb(p, q, h);
			b = Col.hue2rgb(p, q, h - 1/3);
		}

		return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
	}

	/**
	 * http://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
	 * Converts an RGB color value to HSL. Conversion formula
	 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
	 * Assumes r, g, and b are contained in the set [0, 255] and
	 * returns h, s, and l in the set [0, 1].
	 *
	 * @param   Number  r       The red color value
	 * @param   Number  g       The green color value
	 * @param   Number  b       The blue color value
	 * @return  Array           The HSL representation
	 */
	Col.rgbToHsl = function(r, g, b){
		r /= 255, g /= 255, b /= 255;
		var max = Math.max(r, g, b), min = Math.min(r, g, b);
		var h, s, l = (max + min) / 2;

		if(max == min) {
			h = s = 0; // achromatic
		} else {
			var d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			switch(max) {
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
			}
			h /= 6;
		}

		return [h, s, l];
	}

	Col.hueAndLuminanceToXY = function(h,l) {
		r = -128 * (l - 1);
		rads = (h * 360) * (Math.PI / 180);
		x = (r * Math.cos(rads));
		y = (r * Math.sin(rads));
		return [x, y];
	}

	return Col;
})();