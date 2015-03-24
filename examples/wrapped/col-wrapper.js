(function(){
	var root = this;

	var Attach = function(){};

 	if (document.addEventListener) {  // all browsers except IE before version 9
 		Attach = function(element, eventName, func, useCapture) {
 			var events = eventName.split(' ');
 			var numEvents = events.length;
 			useCapture = useCapture === void 0 ? false : useCapture;
 			for(var x = 0; x < numEvents; x++)
 				if(events[x])
					element.addEventListener(events[x], func, useCapture);
		};
	} else {
		if (document.attachEvent) {   // IE before version 9.  I don't know why this code is here...  it's not like it's supported....
	 		Attach = function(element, eventName, func, useCapture) {
	 			var events = eventName.split(' ');
	 			var numEvents = events.length;
	 			for(var x = 0; x < numEvents; x++)
	 				if(events[x])
						element.attachEvent('on' + events[x], func);
			};
		}
	}


	var ColWrapper = function(el) {
		this.red = document.createElement('input'),
		this.green = document.createElement('input'),
		this.blue = document.createElement('input');
		this.hex = document.createElement('input');
		this.red.setAttribute('name', 'red');
		this.green.setAttribute('name', 'green');
		this.blue.setAttribute('name', 'blue');
		this.blue.setAttribute('name', 'hex');
		this.red.className = this.green.className = this.blue.className = 'rgb-field';
		this.hex.className = 'hex-field';
		this.col = new Col(el);
		this.col.addControl('RGB', [this.red, this.green, this.blue]);
		this.col.addControl('Hex', [this.hex]);
		var me = this;
		this.col.on('change', function(info){
			if(info.rgb) {
				me.red.value = info.rgb[0];
				me.green.value = info.rgb[1];
				me.blue.value = info.rgb[2];
				var rHex, gHex, bHex;
				rHex = (info.rgb[0]).toString(16);
				gHex = (info.rgb[1]).toString(16);
				bHex = (info.rgb[2]).toString(16);
				if(rHex.length == 1) rHex = '0' + rHex;
				if(gHex.length == 1) gHex = '0' + gHex;
				if(bHex.length == 1) bHex = '0' + bHex;
				me.hex.value = '#' + rHex + gHex + bHex;
			}
		});

		var updateRGB = function(){
			var r = parseInt(me.red.value), g = parseInt(me.green.value), b = parseInt(me.blue.value);
			if(isNaN(r) || isNaN(g) || isNaN(b))
				return;
			if(r > 255) {
				r = 255;
				me.red.value = 255;
			} else if(r < 0){
				r = 0;
				me.red.value = 0;
			}
			if(g > 255) {
				g = 255;
				me.green.value = 255;
			} else if(g < 0){
				g = 0;
				me.green.value = 0;
			}
			if(b > 255) {
				b = 255;
				me.blue.value = 255;
			} else if(b < 0){
				b = 0;
				me.blue.value = 0;
			}
			me.col.rgb(r, g, b);
		}

		Attach(this.red, 'keyup', updateRGB);
		Attach(this.green, 'keyup', updateRGB);
		Attach(this.blue, 'keyup', updateRGB);
	}
	root.ColWrapper = ColWrapper;
}.call(this));