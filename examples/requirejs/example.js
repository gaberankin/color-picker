requirejs.config({
	baseUrl: "./",

	paths: {
		col: '../../col'	//set path of the col library to the base folder of this project.
	}

});

require(['col'], function (Col) {
	var c = new Col(document.getElementById('picker'));
	//do whatever else here....
});
