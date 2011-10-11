goog.provide('takeNote.Plugins');

goog.require('goog.dom.dataset');


/**
 * @type {Object.<string, function(Object): string>}
 */
takeNote.Plugins = {};


takeNote.Plugins['drawing'] = function (data) {
	var xml = '';
	var state = data.plugin_state;
	state.forEach(function (layer, i) {
		if (i === 0) {
			// The first item is the final merged image
			xml += '<![CDATA[' + layer['data'].match(/;base64,(.*)/)[1] + ']]>';
			xml += '<drawing>';
		} else {
			xml += '<layer';
			if (layer['color']) {
				xml += ' color="' + layer['color'] + '"';
			}
			var data = layer['data'];
			if (data) {
				var mime = data.match(/^data:([\w-\/]+);base64,(.*)/);
				xml += ' type="' + mime[1] + '">';
				xml += '<![CDATA[' + mime[2] + ']]>'
				xml += '</layer>';
			} else {
				xml += ' />';
			}
		}
	});
	xml += '</drawing>';

	return xml;
};
