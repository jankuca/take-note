goog.provide('takeNote.Walker');
goog.provide('takeNote.XMLWalker');

goog.require('goog.dom.dataset');
goog.require('goog.dom.TagName');
goog.require('takeNote.Types');


/**
 * @constructor
 * @param {Element} list A list of block nodes
 * @param {boolean=} visual Whether the source DOM structure is the visual representation
 *   of the data (list-based tree)
 */
takeNote.Walker = function (list, visual) {
	if (!list) {
		throw new Error('List element does not exist.');
	}

	this.list = list;
	this.visual = Boolean(visual);
};

takeNote.Walker.prototype.walk = function () {
	this.handleBlockNodes(this.list.childNodes);
};

/**
 * @param {NodeList|Array} blocks The block nodes to handle
 */
takeNote.Walker.prototype.handleBlockNodes = function (blocks) {
	Array.prototype.forEach.call(blocks, function (node) {
		if (node.nodeType !== node.ELEMENT_NODE) {
			return;
		}

		var data, child_list;

		if (this.visual) {
			data = {
				node: node,
				type: goog.dom.dataset.get(node, 'type'),
				list: goog.dom.dataset.get(node, 'list') || null,
				ref: goog.dom.dataset.get(node, 'ref') || null,
				plugin: goog.dom.dataset.get(node, 'plugin') || null
			};
		} else {
			data = {
				node: node,
				type: node.tagName.toLowerCase(),
				list: node.getAttribute('list') || null
			};
		}
		var result = this.onblockstart(data);
		if (result === false) {
			return;
		}

		if (this.visual) {
			var cnt = node.firstChild;
			Array.prototype.forEach.call(cnt.childNodes, this.handleInlineNode, this);
			child_list = node.lastChild;
			if (child_list && child_list.tagName === goog.dom.TagName.UL) {
				this.handleBlockNodes(child_list.childNodes);
			}
		} else {
			// Text, inline and block childs are not explicitly separated in raw data structures.
			// The boundary is reached when a child node is of a block type.
			child_list = node.childNodes;
			for (var i = 0, ii = child_list.length; i < ii; ++i) {
				var child = child_list[i];
				var key = child.tagName ? child.tagName.toLowerCase() : 'null';
				var type = takeNote.Types[key];
				if (key === 'null' || !type || type.inline) {
					//if (child.nodeType === child.CDATA_SECTION_NODE) {
						this.handleInlineNode(child);
					//}
				} else {
					this.handleBlockNodes(Array.prototype.slice.call(child_list, i - 1));
					break;
				}
			}
		}
		
		this.onblockend(data);
	}, this);
};

takeNote.Walker.prototype.handleInlineNode = function (node) {
	if (node.nodeType === node.ELEMENT_NODE) {
		if (node.tagName.toLowerCase() !== 'null') {
			var data;
			if (this.visual) {
				data = {
					type: this.getInlineType(node)
				};
			} else {
				data = {
					type: node.tagName.toLowerCase()
				};
			}
			var result = this.oninlinestart(data);
			if (result === false) {
				return;
			}
			Array.prototype.forEach.call(node.childNodes, this.handleInlineNode, this);
			this.oninlineend(data);
		} else {
			Array.prototype.forEach.call(node.childNodes, this.handleInlineNode, this);
		}

	} else if (node.nodeType === node.TEXT_NODE
		|| node.nodeType === node.CDATA_SECTION_NODE) {
		if (node.nodeValue !== '') {
			this.ontext(node.nodeValue);
		}
	}
};

takeNote.Walker.prototype.getInlineType = function (node) {
	var types = takeNote.Types;
	var keys = Object.keys(types);
	for (var i = 0, ii = keys.length; i < ii; ++i) {
		var t = types[keys[i]];
		if (t.inline && node.tagName === t.tagName
			&& node.className === (t.className || '')) {
			return keys[i];
		}
	}
	return null;
};
