goog.provide('takeNote.Plugins');

goog.require('goog.dom.dataset');


/**
 * @type {Object.<string, function(Object): string>}
 */
takeNote.Plugins = {};


takeNote.Plugins['drawing'] = function (data) {
	var xml = '';
	var state = data.plugin_state;
	var layer = state[0];
	// The first item is the final merged image
	xml += '<![CDATA[' + layer['data'].match(/;base64,(.*)/)[1] + ']]>';

	return xml;
};
