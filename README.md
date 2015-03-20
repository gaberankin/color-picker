# Col
Yet another color picker, built primarily to teach myself about the canvas.

Demo [here](http://gaberankin.github.io/color-picker/)

There are no dependancies that need to be included.  This was also one of the points of the exercise - to get myself off the crutch of creating elements using jQuery.  Not everyone uses it.

## the name is dumb
Yes.  the name *is* dumb.  I toyed with calling it ColorPicker.  That would have been dumb too.  If you have a better name, mention it in the issues of this project.  I'd appreciate it.  I just called it Col because I am lazy.

## Usage
In your html HEAD:
```html
	<script src="PATH TO COL.JS/col.js"></script>
```

Then, when the document is loaded:

```js
var pickerInstance = new Col(document.getElementById('id-of-container-element'));
```

Note that you don't have to use `document.getElementById`.  as long as you pass it an instance of a dom element, it's cool.

## Binding Events
So you've placed an instance of the picker on your page.  That's nice.  It's not very useful as it is though.  You need to get information from it, or react when it changes.

You can attach events to it by using `.on()`.  Do it like so:

```js
pickerInstance.on('change', function(info){
	//do stuff here
});
```

The passed `info` argument is an object with the following members:

```js
{
	x: "Number, x coordinate on canvas",
	y: "Number, y coordinate on canvas",
	ox: "Number, x coordinate on canvas with respect of origin being in center of canvas",
	oy: "Number, y coordinate on canvas with respect of origin being in center of canvas",
	rgb: ["red number, 0 - 255","green number, 0 - 255","blue number, 0 - 255"],
	hsl: ["hue number, -0.5 - 0.5","saturation number, 0 - 1","luminance number, 0 - 1"]	//note that hue is coming back between -0.5 and 0.5.  this is a known issue.  I'm working on it.
}
```

Here is a list of supported events:

Event Name | When it fires
:---------:|---------------
change     | Whenever the user clicks on the color wheel to select a color, or when the saturation is changed, or when `.rgb()` is called to change the value of the wheel.
mousemove  | Whenever the user moves their mouse over the color wheel.

Events can be unbound by using `.off()`:

```js
var pickerChangeFunction = function(info){
	//stuff happens
}

pickerInstance.on('change', pickerChangeFunction);	//event is bound.

// other stuff happens
// ...
///

pickerInstance.off('change', pickerChangeFunction);	//event is unbound.
```

Both `.on()` and `.off()` support chaining.

## Instance Methods

### `.setSaturation(saturation)`

When passed a value between 0 and 1 (0 meaning grayscale, 1 meaning full-color), the color wheel will update with the new saturation value.  Note that the passed value will automatically be rounded to the nearest 100th of a decimal point.
The object is returned, to support chaining.

Example:
```js
pickerInstance.setSaturation(0.35);	 //sets saturation to 35%
pickerInstance.setSaturation(0.354); //sets saturation to 35%
pickerInstance.setSaturation(0.355); //sets saturation to 36%
```


### `.rgb([r], [g], [b])`

This function has two modes - as a setter and as a getter.
 + Pass no arguments to run as a getter.  When run this way, the currently selected rgb value will be returned in an array of format [r, g, b]
   + **returns null if no color is selected.**
 + Pass with 3 arguments to run as a setter.  When run this way, the color wheel will update, the `change` event will fire, and the object will be returned (to support chaining)

Example:
```js
var current = pickerInstance.rgb();	 //returns rgb color array, null if none selected.
pickerInstance.rgb(255, 255, 255);	 //sets color to white.
current = pickerInstance.rgb();	 //returns rgb color array that looks like [255, 255, 255]
```

## Class Methods

### `Col.hslToRgb(hue, saturation, luminance)`
*Thanks to http://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion*

Converts an HSL color value to RGB. Conversion formula adapted from http://en.wikipedia.org/wiki/HSL_color_space.

Assumes hue, saturation, and luminance are contained in the set [0, 1] and returns array of red, green, and blue in the set [0, 255].

### `Col.rgbToHsl(red, green, blue)`
*Thanks to http://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion*

Converts an RGB color value to HSL. Conversion formula adapted from http://en.wikipedia.org/wiki/HSL_color_space.

Assumes red, green, and blue are contained in the set [0, 255] and returns array of hue, saturation, and luminance in the set [0, 1].
