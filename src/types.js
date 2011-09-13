goog.provide('takeNote.Types');

/**
 * @enum {!Object.<string, {inline: boolean, tagName: goog.dom.TagName, className: string, nextBlockType: string}>}
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
	'standalone': {
		tagName: 'DIV',
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
		className: 'highlight'
	},
	'strike': {
		inline: true,
		tagName: 'S'
	}
};
