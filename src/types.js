goog.provide('takeNote.Types');

goog.require('takeNote.Plugins');


/**
 * @enum {!Object.<string, {inline: boolean, tagName: goog.dom.TagName, editable: boolean, className: string, nextBlockType: string}>}
 */
takeNote.Types = {
	'text': {
		tagName: 'P'
	},
	'h1': {
		tagName: 'H1',
		nextBlockType: 'text'
	},
	'h2': {
		tagName: 'H2',
		nextBlockType: 'text'
	},
	'h3': {
		tagName: 'H3',
		nextBlockType: 'text'
	},

	'strong': {
		inline: true,
		tagName: 'STRONG'
	},
	'em': {
		inline: true,
		tagName: 'EM'
	},
	'u': {
		inline: true,
		tagName: 'U'
	},
	'highlight': {
		inline: true,
		tagName: 'MARK',
		className: 'highlight',
		attributes: {
			'color': '$color'
		}
	},
	'strike': {
		inline: true,
		tagName: 'S'
	},

	'sub': {
		inline: true,
		group: 'indexes',
		tagName: 'SUB'
	},
	'sup': {
		inline: true,
		group: 'indexes',
		tagName: 'SUP'
	},

	'font': {
		inline: true,
		tagName: 'FONT',
		attributes: {
			'color': 'color'
		}
	},

	'a': {
		inline: true,
		tagName: 'A',
		attributes: {
			'href': 'href'
		}
	},

	'image': {
		tagName: 'IMG',
		nextBlockType: 'text',

		toXML: function (data) {
			var xml = '<' + data.type;
			if (data.list) {
				xml += ' list="' + data.list + '"';
			}
			if (data.ref) { // referenced
				xml += ' ref="' + data.ref + '">';
			} else { // embedded
				if (data.plugin) {
					xml += ' type="image/png"';
					xml += '>';
					xml += data.plugin(data);
				} else {
					var src = data.node.firstChild.src;
					if (src.substr(0, 5) === 'data:') {
						var mime = src.match(/^data:([\w-\/]+);base64,(.*)/);
						xml += ' type="' + mime[1] + '"';
						xml += '><![CDATA[' + mime[2] + ']]>';
					} else {
						xml += '>';
					}
				}
			}
			return xml;
		},
		toDOM: function (data) {
			if (data.node.getAttribute('ref')) {
				return document.createTextNode('[Referenced images not supported]');
			}
			var cdata_src = data.node.firstChild;
			data.node.removeChild(cdata_src);
			var img = new Image();
			img.src = 'data:' + data.node.getAttribute('type') + ';base64,' + cdata_src.nodeValue;
			return img;
		}
	}
};
