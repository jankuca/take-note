goog.provide('takeNote.paste.Types');


/**
 * Types definition used by cleaner.
 * @return {Object.<string, Object.<string, string|Array.<string>|function(string): Array.<Array.<string>>|Object.<string, function(string): Array.<Array.<string>>>|Boolean>>}
 */
takeNote.paste.Types = (function () {
	// Types definition
	var types = {
		// Block elements
		'p': {
			tag_name: 'text',
			type: 'block',
			child_types: ['%inline%', '%text%'],
			empty: true
		},
		
		'h1': {
			tag_name: 'h1',
			type: 'block',
			child_types: ['%inline%', '%text%']
		},
		'h2': {
			tag_name: 'h2',
			type: 'block',
			child_types: ['%inline%', '%text%']
		},
		'h3': {
			tag_name: 'h3',
			type: 'block',
			child_types: ['%inline%', '%text%']
		},
		'h4': {
			tag_name: 'h4',
			type: 'block',
			child_types: ['%inline%', '%text%']
		},
		'h5': {
			tag_name: 'h5',
			type: 'block',
			child_types: ['%inline%', '%text%']
		},
		'h6': {
			tag_name: 'h6',
			type: 'block',
			child_types: ['%inline%', '%text%']
		},
		
		'blockquote': {
			tag_name: 'quote',
			type: 'block',
			child_types: ['%flow%']
		},
		
		// Inline elements
		'a': {
			tag_name: 'a',
			type: 'inline',
			child_types: ['%inline%', '%text%'],
			attributes: {
				'href': function (value) {
					return ['href', value];
				}
			}
		},
		'b': {
			tag_name: 'strong',
			type: 'inline',
			child_types: ['%inline%', '%text%']
		},
		'strong': {
			tag_name: 'strong',
			type: 'inline',
			child_types: ['%inline%', '%text%']
		},
		'i': {
			tag_name: 'em',
			type: 'inline',
			child_types: ['%inline%', '%text%']
		},
		'em': {
			tag_name: 'em',
			type: 'inline',
			child_types: ['%inline%', '%text%']
		},
		'sub': {
			tag_name: 'sub',
			type: 'inline',
			child_types: ['%inline%', '%text%']
		},
		'sup': {
			tag_name: 'sup',
			type: 'inline',
			child_types: ['%inline%', '%text%']
		},
		'u': {
			tag_name: 'u',
			type: 'inline',
			child_types: ['%inline%', '%text%']
		},
		's': {
			tag_name: 'strike',
			type: 'inline',
			child_types: ['%inline%', '%text%']
		},
		'strike': {
			tag_name: 'strike',
			type: 'inline',
			child_types: ['%inline%', '%text%']
		},
		'code': {
			tag_name: 'code',
			type: 'inline',
			child_types: ['%inline%', '%text%']
		},
		'cite': {
			tag_name: 'cite',
			type: 'inline',
			child_types: ['%inline%', '%text%']
		},

		// New types
		'_highlight': {
			tag_name: 'highlight',
			type: 'inline',
			child_types: ['%inline%', '%text%'],
			attributes: {
				'color': function (value) {
					return ['color', value];
				}
			}
		},
		'_font': {
			tag_name: 'font',
			type: 'inline',
			child_types: ['%inline%', '%text%'],
			attributes: {
				'color': function (value) {
					return ['color', value];
				}
			}
		},

		// Lists
		'ul': {
			type: 'block',
			child_types: ['%list_item%', 'ul', 'ol']
		},
		'ol': {
			type: 'block',
			child_types: ['%list_item%', 'ul', 'ol']
		},
		'li': {
			tag_name: 'text',
			tag_attrs: {
			type: function (parent) {
					return ['list', (parent === 'ol') ? 'number' : 'disc'];
				}
			},
			type: 'list_item',
			parent_types: ['ul', 'ol'],
			child_types: ['%flow%']
		},
		
		'dl': {
			tag_name: 'text',
			type: 'block',
			child_types: ['%def_list_item%']
		},
		'dt': {
			tag_name: 'strong',
			type: 'def_list_item',
			parent_types: ['dl'],
			child_types: ['%inline%', '%text%']
		},
		'dd': {
			type: 'def_list_item',
			parent_types: ['dl'],
			child_types: ['%flow%']
		},
		
		// Table
		'table': {
			tag_name: 'table',
			type: 'block',
			child_types: ['tr']
		},
		'tr': {
			tag_name: 'tr',
			type: 'table_row',
			parent_types: ['table'],
			child_types: ['%table_content%']
		},
		'td': {
			tag_name: 'td',
			type: 'table_content',
			parent_types: ['%table_row%'],
			child_types: ['%flow%']
		},
		'th': {
			tag_name: 'th',
			type: 'table_content',
			parent_types: ['%table_row%'],
			child_types: ['%flow%']
		},
		
		// Copy content
		'acronym': {
			type: 'inline',
			child_types: ['%inline%', '%text%']
		},
		'ins': {
			type: 'inline',
			child_types: ['%inline%', '%text%']
		},
		'small': {
			type: 'inline',
			child_types: ['%inline%', '%text%']
		},
		'span': {
			type: 'inline',
			child_types: ['%inline%', '%text%']
		},
		'st1': {
			type: 'inline',
			child_types: ['%inline%', '%text%']
		},
		'var': {
			type: 'inline',
			child_types: ['%inline%', '%text%']
		},
		'wbr': {
			type: 'inline',
			child_types: ['%inline%', '%text%']
		},
		// Copy content + Attributes as style
		'font': {
			type: 'inline',
			child_types: ['%inline%', '%text%'],
			attrs_as_style: {
				'color': 'color'
			}
		},

		// Replace
		'br': {
			replace: 'p'
		},
		'div': {
			replace: 'p'
		},
		'pre': {
			replace: 'p'
		}
	}
	// End of types definition
	
	var types_group = {};
	
	Object.keys(types).forEach(function (type_name) {
		var type = types[type_name];
		if (!types_group[type.type]) {
			types_group[type.type] = [type_name];
		} else {
			types_group[type.type].push(type_name);
		}
	});
	
	types_group['text'] = ['text'];
	types_group['flow'] = [].concat(types_group['block'], types_group['inline'], types_group['text']);
	
	Object.keys(types).forEach(function (type_name) {
		var type = types[type_name];
		
		if (type.child_types) {
			type['childs'] = {};
			type.child_types.forEach(function (child_type) {
				var w_type = child_type.match(/%(\w*)%/);
				if (w_type) {
					var w_types_group = types_group[w_type[1]];
					if (w_types_group) {
						for (var i = 0; i < w_types_group.length; i++) {
							type['childs'][w_types_group[i]] = {};
						} 
					}
				} else {
					type['childs'][child_type] = {}
				}
			});
		}
		
		if (type.parent_types) {
			type['parents'] = {};
			type.parent_types.forEach(function (parent_type) {
				var w_type = parent_type.match(/%(\w*)%/);
				if (w_type) {
					var w_types_group = types_group[w_type[1]];
					if (w_types_group) {
						for (var i = 0; i < w_types_group.length; i++) {
							type['parents'][w_types_group[i]] = {};
						}
					}
				} else {
					type['parents'][parent_type] = {}
				}
			});
		}	
	});
	
	return types;
})();