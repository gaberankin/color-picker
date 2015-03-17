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

	var Col = function(container){
		var w = h = 256;
		var ox = (w / 2), oy = (h / 2);	//origin for point calculations

		this.parentContainer = container;
		this.container = El('div', {'class':'color-thing','style' : {'width': w,'height': h,'padding':0,'margin':0}});
		this.canvas = El('canvas', {'width': w,'height': h, 'style' : {'width': w,'height': h}});
		this.parentContainer.appendChild(this.container);
		this.container.appendChild(this.canvas);
		this.saturation = 1;

		this.context = this.canvas.getContext('2d');

		if (!this.context.setLineDash) {
			this.context.setLineDash = function () {}
		}
		this.wheelData = {};
		var pipDrawn = false;

		me = this;
		console.log(w, h);
		var drawPip = function(x, y){
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
			me.context.setLineDash([0]);
			me.context.lineWidth = 1;
			me.context.moveTo(x - 5, y);
			me.context.lineTo(x + 5, y);
			me.context.moveTo(x, y - 5);
			me.context.lineTo(x, y + 5);
			me.context.stroke();
		}
		var clearPip = function() {
			me.draw();
			pipDrawn = false;
		}

		Attach(this.canvas, 'mousemove', function(e) {
			var x = e.offsetX - ox;
			var y = e.offsetY - oy;
			dist = Math.sqrt(x*x + y*y);

			if(dist <= ox) {
				drawPip(e.offsetX, e.offsetY);
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
					clearPip();
			}
		});
		Attach(this.canvas, 'mouseout', function(e){
			if(pipDrawn)
				clearPip();
		});

		me.draw();
	}
	Col.prototype.draw = function(saturation){
		this.saturation = saturation === void 0 ? this.saturation : parseFloat(saturation);

		if(this.wheelData['d' + this.saturation] === void 0) {
			var imageData = this.context.createImageData(1, 1);
			var imageDataData = imageData.data;
			var x, y, color, h, l, rads, inc;

			this.context.beginPath();
			this.context.rect(0, 0, this.canvas.width, this.canvas.height);
			this.context.fillStyle = '#000';
			this.context.fill();

			for(var r = 0; r <= 128; r += 0.891) {
				l = 1- (r / 128);
				inc = l;
				if(inc <= 0.001)
					inc = 1;
				for(var a = 0; a <= 360; a+=inc) {
					rads = a * (Math.PI / 180);
					h = a / 360;
					x = (r * Math.cos(rads)) + 128;
					y = (r * Math.sin(rads)) + 128;
					color = Col.hslToRgb(h, this.saturation, l);

					imageDataData[0] = color[0];
					imageDataData[1] = color[1];
					imageDataData[2] = color[2];
					imageDataData[3] = 255;

					this.context.putImageData(imageData, x, y);

				}
			}
			this.context.beginPath();
			this.context.arc(128, 128, 129, 0, 2 * Math.PI, false);
			this.context.lineWidth = 1;
			this.context.strokeStyle = 'rgba(255,255,255,0.3)';
			this.context.stroke();
			this.wheelData['d' + this.saturation] = this.context.getImageData(0,0, this.canvas.width, this.canvas.height);
		}
		else
		{
			this.context.putImageData(this.wheelData['d' + this.saturation], 0, 0);
		}
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
	 *	originally found inside hlsToRgb().  took it out because why declare it every time the function is called?
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

	return Col;
})();