goog.provide('takeNote.Types');

/**
 * @enum {!Object.<string, {inline: boolean, tagName: goog.dom.TagName, className: string, nextBlockType: string}>}
 */
takeNote.Types = {
	'paragraph': {
		tagName: 'P'
	},
	'h1': {
		tagName: 'H1',
		nextBlockType: 'paragraph'
	},
	'h2': {
		tagName: 'H2',
		nextBlockType: 'paragraph'
	},
	'h3': {
		tagName: 'H3',
		nextBlockType: 'paragraph'
	},
	'standalone': {
		tagName: 'DIV',
		nextBlockType: 'paragraph'
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
