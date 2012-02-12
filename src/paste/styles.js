goog.require('takeNote.paste.RGBColor');

goog.provide('takeNote.paste.Styles');


/**
 * Styles definition used by cleaner.
 * @enum {function(string): Array.<string, string|null>}
 */
takeNote.paste.Styles = {
	'font-weight': function (value) {
		switch (value) {
			case 'bold': 
				return ['strong'];
				break;
		}
	},

	'font-style': function (value) {
		switch (value) {
			case 'italic': 
				return ['em'];
				break;
		}
	},

	'text-decoration': function (value) {
		switch (value) {
			case 'underline':
				return ['u'];
				break;
			case 'line-throught':
				return ['strike'];
				break;
		}
	},

	'background-color': function (value) {
		var color = new takeNote.paste.RGBColor(value).toHex();
		if (color) {
			return ['_highlight', ['color', color]];	
		}
	},

	'color': function (value) {
		var color = new takeNote.paste.RGBColor(value).toHex();
		if (color) {
			return ['_font', ['color', color]];	
		}
	}
}
